#lang racket

(define (fib n)
  (if (<= n 2)
      1
      (+ (fib (- n 1)) (fib (- n 2)))))

(test-suite
 "implement-fvars"

 (test-case
  "simple (test)"
  (check-equal? (implement-fvars
                 '(begin
                    (set! r10 fv0)
                    (set! r11 fv1)
                    (set! r10 (+ r10 r11))
                    (set! fv0 r10)
                    (set! rax fv0)))
                '(begin
                   (set! r10 (rbp - 0))
                   (set! r11 (rbp - 8))
                   (set! r10 (+ r10 r11))
                   (set! (rbp - 0) r10)
                   (set! rax (rbp - 0))))))