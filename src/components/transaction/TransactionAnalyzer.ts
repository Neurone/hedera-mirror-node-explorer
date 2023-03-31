/*-
 *
 * Hedera Mirror Node Explorer
 *
 * Copyright (C) 2021 - 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {computed, ComputedRef, ref, Ref, watch, WatchStopHandle} from "vue";
import {Transaction, TransactionType} from "@/schemas/HederaSchemas";
import {TransactionByTsCache} from "@/utils/cache/TransactionByTsCache";
import {EntityDescriptor} from "@/utils/EntityDescriptor";
import {computeNetAmount} from "@/utils/TransactionTools";
import {base64DecToArr, byteToHex} from "@/utils/B64Utils";
import {systemContractRegistry} from "@/schemas/SystemContractRegistry";
import {normalizeTransactionId} from "@/utils/TransactionID";
import {ContractByIdCache} from "@/utils/cache/ContractByIdCache";
import {AccountByIdCache} from "@/utils/cache/AccountByIdCache";
import {BlockByTsCache} from "@/utils/cache/BlockByTsCache";

export class TransactionAnalyzer {

    public readonly consensusTimestamp: Ref<string|null>
    public readonly transaction: Ref<Transaction|null> = ref(null)
    public readonly contractId: Ref<string|null> = ref(null)
    public readonly accountId: Ref<string|null> = ref(null)
    public readonly blockNumber: Ref<number|null> = ref(null)
    private readonly watchHandles: WatchStopHandle[] = []

    //
    // Public
    //

    public constructor(consensusTimestamp: Ref<string|null>) {
        this.consensusTimestamp = consensusTimestamp
    }

    public mount(): void {
        this.watchHandles.push(
            watch(this.consensusTimestamp, this.transactionIdDidChange, {immediate: true})
        )
    }

    public unmount(): void {
        this.watchHandles.map((wh) => wh())
        this.watchHandles.splice(0)
        this.transaction.value = null
    }

    public readonly transactionType = computed(() => this.transaction.value?.name ?? null)

    public readonly entityId = computed(() => this.transaction.value?.entity_id ?? null)

    public readonly result: ComputedRef<string|null> = computed(
        () => this.transaction.value?.result ?? null)

    public readonly hasSucceeded: ComputedRef<boolean> = computed(() => this.result.value == "SUCCESS")

    public readonly netAmount: ComputedRef<number> = computed(
        () => this.transaction.value !== null ? computeNetAmount(this.transaction.value) : 0)

    public readonly maxFee: ComputedRef<number> = computed(() => {
        const result = this.transaction.value?.max_fee ? Number.parseFloat(this.transaction.value?.max_fee) : 0
        return isNaN(result) ? -9999 : result
    })

    public readonly formattedTransactionId: ComputedRef<string|null> = computed(() => {
        const transaction_id = this.transaction.value?.transaction_id
        return transaction_id ? normalizeTransactionId(transaction_id, true) : null
    })

    public readonly formattedHash: ComputedRef<string|null> = computed( () => {
        const hash = this.transaction.value?.transaction_hash
        return hash ? byteToHex(base64DecToArr(hash)) : null
    })

    public readonly systemContract: ComputedRef<string|null> = computed(() => {
        let result: string|null
        if (this.transaction.value?.name === TransactionType.CONTRACTCALL && this.transaction.value.entity_id) {
            result = systemContractRegistry.lookup(this.transaction.value.entity_id)?.description ?? null
        } else {
            result = null
        }
        return result
    })

    //
    // Public (entityDescriptor)
    //

    public readonly entityDescriptor = computed(() => {
        let result: EntityDescriptor|null
        if (this.contractId.value !== null) {
            result = new EntityDescriptor("Contract ID", "ContractDetails")
        } else if (this.accountId.value !== null) {
            result = new EntityDescriptor("Account ID", "AccountDetails")
        } else if (this.transaction.value !== null) {
            result = EntityDescriptor.makeEntityDescriptor(this.transaction.value)
        } else {
            result = null
        }
        return result
    })

    //
    // Private
    //

    private readonly transactionIdDidChange = async (): Promise<void> => {
        if (this.consensusTimestamp.value !== null) {
            const tx = await TransactionByTsCache.instance.lookup(this.consensusTimestamp.value)
            this.transaction.value = Object.preventExtensions(tx)
        } else {
            this.transaction.value = null
        }
        await this.transactionDidChange()
    }

    private async transactionDidChange(): Promise<void> {
        if (this.transaction.value !== null) {
            const entityId = this.transaction.value?.entity_id ?? null
            if (entityId !== null) {
                switch(this.transaction.value.name) {
                    case TransactionType.ETHEREUMTRANSACTION: {
                        const contract = await ContractByIdCache.instance.lookup(entityId)
                        if (contract !== null) {
                            this.contractId.value = entityId
                            this.accountId.value = null
                        } else {
                            const account = await AccountByIdCache.instance.lookup(entityId)
                            if (account !== null) {
                                this.contractId.value = null
                                this.accountId.value = entityId
                            } else {
                                this.contractId.value = null
                                this.accountId.value = null
                            }
                        }
                        break
                    }
                    case TransactionType.CONTRACTCREATEINSTANCE:
                    case TransactionType.CONTRACTCALL:
                    case TransactionType.CONTRACTUPDATEINSTANCE:
                    case TransactionType.CONTRACTDELETEINSTANCE:
                        this.contractId.value = this.transaction.value?.entity_id ?? null
                        this.accountId.value = null
                        break
                    default:
                        this.contractId.value = null
                        this.accountId.value = null
                }
            } else {
                this.contractId.value = null
                this.accountId.value = null
            }
            const consensusTimestamp = this.transaction.value?.consensus_timestamp ?? null
            if (consensusTimestamp !== null) {
                const block = await BlockByTsCache.instance.lookup(consensusTimestamp)
                this.blockNumber.value = block?.number ?? 0
            } else {
                this.blockNumber.value = null
            }
        } else {
            this.contractId.value = null
            this.accountId.value = null
            this.blockNumber.value = null
        }
    }
}