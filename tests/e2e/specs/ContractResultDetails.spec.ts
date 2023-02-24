// noinspection DuplicatedCode

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

// https://docs.cypress.io/api/introduction/api.html

import {normalizeTransactionId} from "../../../src/utils/TransactionID";

describe('ContractResultDetails', () => {

    it('should display contract result of contract call transaction', () => {
        const transactionId = "0.0.849013@1674816312.786087545"
        const consensusTimestamp = "1674816325.275978041"

        cy.visit('mainnet/transaction/' + consensusTimestamp + "?tid=" + normalizeTransactionId(transactionId))
        cy.url().should('include', '/mainnet/transaction/')
        cy.url().should('include', normalizeTransactionId(transactionId))
        cy.url().should('include', consensusTimestamp)

        cy.get('#transactionTypeValue').should('have.text', 'CONTRACT CALL')
        cy.get('#entityIdValue').should('have.text', '0.0.1186129')
        cy.contains('Contract Result')
        cy.get('#resultValue').should('have.text', 'SUCCESS')
        cy.get('#fromValue').should('have.text', '0x00000000000000000000000000000000000cf475Copy to Clipboard(0.0.849013)')
        cy.get('#toValue').should('have.text', '0x0000000000000000000000000000000000121951Copy to Clipboard(0.0.1186129)')
    })

    it('should display contract result of child (contract call) transaction', () => {
        const transactionId = "0.0.1753656@1674816661.856939387"
        const consensusTimestamp = "1674816673.923476354"

        cy.visit('mainnet/transaction/' + consensusTimestamp + "?tid=" + normalizeTransactionId(transactionId))
        cy.url().should('include', '/mainnet/transaction/')
        cy.url().should('include', normalizeTransactionId(transactionId))
        cy.url().should('include', consensusTimestamp)

        cy.get('#transactionTypeValue').should('have.text', 'CONTRACT CALL')
        cy.get('#entityIdValue').should('have.text', 'Hedera Token Service System Contract')
        cy.contains('Contract Result')
        cy.get('#resultValue').should('have.text', 'SUCCESS')
        cy.get('#fromValue').should('have.text', '0x00000000000000000000000000000000001ac238Copy to Clipboard(0.0.1753656)')
        cy.get('#toValue').should('have.text', '0x0000000000000000000000000000000000000167Copy to Clipboard(Hedera Token Service System Contract)')
    })

    it('should display contract result of child (token burn) transaction', () => {
        const transactionId = "0.0.1123011@1674816563.776883593"
        const consensusTimestamp = "1674816577.015074957"

        cy.visit('mainnet/transaction/' + consensusTimestamp + "?tid=" + normalizeTransactionId(transactionId))
        cy.url().should('include', '/mainnet/transaction/')
        cy.url().should('include', normalizeTransactionId(transactionId))
        cy.url().should('include', consensusTimestamp)

        cy.get('#transactionTypeValue').should('have.text', 'TOKEN BURN')
        cy.get('#entityIdValue').should('have.text', '0.0.1456986')
        cy.contains('Contract Result')
        cy.get('#resultValue').should('have.text', 'SUCCESS')
        cy.get('#fromValue').should('have.text', '0x00000000000000000000000000000000001122c3Copy to Clipboard(0.0.1123011)')
        cy.get('#toValue').should('have.text', '0x0000000000000000000000000000000000000167Copy to Clipboard(Hedera Token Service System Contract)')
    })

    it('should display contract result of child (crypto transfer) transaction', () => {
        const transactionId = "0.0.1123011@1674816563.776883593"
        const consensusTimestamp = "1674816577.015074956"

        cy.visit('mainnet/transaction/' + consensusTimestamp + "?tid=" + normalizeTransactionId(transactionId))
        cy.url().should('include', '/mainnet/transaction/')
        cy.url().should('include', normalizeTransactionId(transactionId))
        cy.url().should('include', consensusTimestamp)

        cy.get('#transactionTypeValue').should('have.text', 'CRYPTO TRANSFER')
        cy.get('#entityIdValue').should('not.exist')
        cy.contains('Contract Result')
        cy.get('#resultValue').should('have.text', 'SUCCESS')
        cy.get('#fromValue').should('have.text', '0x00000000000000000000000000000000001122c3Copy to Clipboard(0.0.1123011)')
        cy.get('#toValue').should('have.text', '0x0000000000000000000000000000000000000167Copy to Clipboard(Hedera Token Service System Contract)')
    })
})
