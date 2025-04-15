
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


;; Get user deposit amount
(define-read-only (get-user-deposit (user principal))
  (default-to u0 (map-get? user-deposits user))
)

;; Get user shares
(define-read-only (get-user-shares (user principal))
  (default-to u0 (map-get? user-shares user))
)

;; Get pool status
(define-read-only (get-pool-status)
  {
    active: (var-get pool-active),
    total-stacked: (var-get total-stacked),
    cycle-start-block: (var-get cycle-start-block),
    cycle-end-block: (var-get cycle-end-block),
    stacking-unlocked: (var-get stacking-unlocked),
    rewards-received: (var-get rewards-received)
  }
)

;; Calculate user's share percentage (returns basis points: 1/100 of 1%)
(define-read-only (get-user-share-percentage (user principal))
  (let (
    (user-deposit (get-user-deposit user))
    (total-pool (var-get total-stacked))
  )
    (if (or (is-eq user-deposit u0) (is-eq total-pool u0))
      u0
      (/ (* user-deposit u10000) total-pool)
    )
  )
)

;; Calculate user's pending rewards
(define-read-only (get-user-pending-rewards (user principal))
  (let (
    (share-percentage (get-user-share-percentage user))
    (total-rewards (var-get rewards-received))
    (fee-percentage PLATFORM-FEE-PERCENT)
  )
    (if (is-eq share-percentage u0)
      u0
      (let (
        (user-portion (/ (* total-rewards share-percentage) u10000))
        (fee-amount (/ (* user-portion fee-percentage) u100))
      )
        (- user-portion fee-amount)
      )
    )
  )
)


;; Check if user has claimed rewards for the current cycle
(define-read-only (has-claimed-rewards (user principal))
  (default-to false (map-get? reward-claimed { user: user, cycle: (var-get cycle-start-block) }))
)

;; Check if stacking is currently locked
(define-read-only (is-stacking-locked)
  (not (var-get stacking-unlocked))
)

;; Get current block height
(define-read-only (get-current-block)
  block-height
)


