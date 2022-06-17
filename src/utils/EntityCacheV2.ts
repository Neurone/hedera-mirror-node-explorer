/*-
 *
 * Hedera Mirror Node Explorer
 *
 * Copyright (C) 2021 - 2022 Hedera Hashgraph, LLC
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

import {AxiosResponse} from "axios";
import {computed, Ref, ref, watch} from "vue";


export abstract class EntityCacheV2<E> {

    private readonly updatePeriod: number|null
    private readonly maxUpdateCount: number|null
    private timeoutID = -1
    private updateCount = 0
    private sessionId = 0

    public readonly state: Ref<EntityCacheStateV2> = ref(EntityCacheStateV2.Stopped)
    public readonly response: Ref<AxiosResponse<E> | null> = ref(null)
    public readonly entity: Ref<E | null> = computed(() => {
        return this.response.value?.data ?? null
    })

    //
    // Public
    //

    protected constructor(updatePeriod: number|null = null, maxUpdateCount: number|null = 10) {
        this.updatePeriod = updatePeriod
        this.maxUpdateCount = maxUpdateCount

        watch(this.state, (newValue, oldValue) => { this.stateDidChange(newValue, oldValue) })
    }

    public clear(): void {
        console.warn("EntityCacheV2.clear()")
        const wasStarted = this.state.value == EntityCacheStateV2.Started
        if (wasStarted) {
            this.state.value = EntityCacheStateV2.Stopped
        }
        this.response.value = null
        this.updateCount = 0
        if (wasStarted) {
            this.state.value = EntityCacheStateV2.Started
        }
    }

    //
    // Protected
    //

    protected abstract load(): Promise<AxiosResponse<E>>;

    //
    // Private
    //

    private stateDidChange(newValue: EntityCacheStateV2, oldValue: EntityCacheStateV2): void {
        if (oldValue != newValue) {
            switch(oldValue) {
                case EntityCacheStateV2.Started:
                    // => newValue == EntityCacheStateV2.Stopped || newValue == EntityCacheStateV2.AutoStopped
                    // => we stop
                    if (this.timeoutID != -1) {
                        clearTimeout(this.timeoutID)
                        this.timeoutID = -1
                    }
                    this.sessionId += 1
                    break;
                case EntityCacheStateV2.Stopped:
                case EntityCacheStateV2.AutoStopped:
                    // => newValue == EntityCacheStateV2.Started
                    // => we start
                    this.updateCount = 0
                    this.updateCache()
                    break;
            }
        }
    }

    private updateCache(): void {
        const resolve = (newResponse: AxiosResponse<E>) => this.loadDidComplete(newResponse, this.sessionId)
        const reject = (/*reason: unknown*/) => this.loadDidComplete(null, this.sessionId)
        this.load().then(resolve, reject)
    }

    private loadDidComplete(newResponse: AxiosResponse<E> | null, sessionId: number) {
        if (this.sessionId == sessionId) {
            this.timeoutID = -1
            if (newResponse != null) {
                this.response.value = newResponse
                this.updateCount += 1
            } // else we keep last response and update count unchanged
            if (this.updatePeriod != null && this.updateCount < this.computeMaxUpdateCount()) {
                this.timeoutID = setTimeout(() => {
                    this.updateCache()
                }, this.updatePeriod)
            } else {
                this.state.value = EntityCacheStateV2.AutoStopped
            }
        }
    }

    private computeMaxUpdateCount(): number {
        return this.maxUpdateCount != null ? this.maxUpdateCount : 999999999
    }
}

export enum EntityCacheStateV2 { Started = "STARTED", Stopped = "STOPPED", AutoStopped = "AUTO_STOPPED"}
