<?php

namespace App\Console\Commands;

use App\Models\Fee;
use App\Models\Session;
use App\Models\Transaction;
use Illuminate\Console\Command;

class FixTransactionMetadata extends Command
{
    protected $signature   = 'fix:transaction-metadata';
    protected $description = 'Backfill session_id and term into transaction metadata for Paystack DVA payments';

    public function handle()
    {
        $transactions = Transaction::where('status', 'success')->get();
        $fixed = 0;

        foreach ($transactions as $t) {
            $meta = $t->metadata ?? [];

            // Already has session_id and term – skip
            if (isset($meta['session_id'], $meta['term'])) {
                continue;
            }

            // Try to resolve session from the linked fee first
            $session = null;
            $fee     = null;

            if ($t->fee_id) {
                $fee = Fee::find($t->fee_id);
                if ($fee && $fee->session_id) {
                    $session = Session::find($fee->session_id);
                }
            }

            // Fallback: use current session for this institution
            if (!$session && $t->institution_id) {
                $session = Session::where('institution_id', $t->institution_id)
                    ->where('is_current', true)
                    ->first();
            }

            if (!$session) {
                $this->warn("No session found for transaction #{$t->id} – skipping");
                continue;
            }

            $meta['session_id'] = $session->id;
            $meta['term']       = $session->current_term ?? '1st Term';

            if ($fee) {
                $meta['fees'] = [$fee->title];
            }

            // Use update() to avoid touching timestamps
            Transaction::where('id', $t->id)->update(['metadata' => json_encode($meta)]);
            $fixed++;
            $this->line("Fixed transaction #{$t->id} – session {$session->name} / {$meta['term']}");
        }

        $this->info("Done. Fixed {$fixed} transaction(s).");
        return 0;
    }
}
