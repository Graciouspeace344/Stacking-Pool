
;; title: Stacking Pool Contract
;; version: 1.0
;; summary: A contract for users to pool their STX for Bitcoin yield
;; description: Allows users to pool their STX tokens to participate in the Stacks blockchain's Stacking mechanism collectively

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-POOL-INACTIVE (err u101))
(define-constant ERR-POOL-ACTIVE (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-TRANSFER-FAILED (err u104))
(define-constant ERR-STACKING-FAILED (err u105))
(define-constant ERR-NO-FUNDS-TO-WITHDRAW (err u106))
(define-constant ERR-STILL-LOCKED (err u107))
(define-constant ERR-NOT-ELIGIBLE (err u108))
(define-constant ERR-MIN-AMOUNT-REQUIRED (err u109))
(define-constant ERR-REWARDS-CLAIM-FAILED (err u110))
(define-constant ERR-DISTRIBUTION-FAILED (err u111))
(define-constant ERR-ALREADY-CLAIMED (err u112))

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant MIN-PARTICIPATION-AMOUNT u50000000) ;; 50 STX minimum (in microSTX)
(define-constant PLATFORM-FEE-PERCENT u5) ;; 5% fee on rewards
(define-constant CYCLE-LENGTH u2100) ;; Length of stacking cycle in blocks (approximately 2 weeks)



;; Data variables
(define-data-var pool-active bool false)
(define-data-var total-stacked uint u0)
(define-data-var cycle-start-block uint u0)
(define-data-var cycle-end-block uint u0)
(define-data-var min-stx-to-stack uint u0) ;; Minimum STX required by protocol
(define-data-var stacking-unlocked bool false)
(define-data-var rewards-received uint u0)
(define-data-var fees-collected uint u0)

;; Maps
(define-map user-deposits principal uint)
(define-map user-shares principal uint)
(define-map last-user-rewards principal uint)
(define-map reward-claimed { user: principal, cycle: uint } bool)

