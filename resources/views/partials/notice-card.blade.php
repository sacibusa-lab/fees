<div class="notice-card">
                <div class="header">
                    @if($institution && $institution->logo)
                        <img src="{{ public_path(str_replace(url('/'), '', $institution->logo)) }}" class="logo">
                    @else
                        <div style="width: 30px; height: 30px; background: #eee; border-radius: 50%; display: inline-block; line-height: 30px; font-size: 6px;">Logo</div>
                    @endif
                    <div class="institution-name">{{ $institution->name ?? 'Institution' }}</div>
                    <div class="notice-label">{{ $fee_title && $fee_title !== 'all' ? strtoupper($fee_title) : 'PAYMENT NOTICE' }}</div>
                    <div class="fee-title">{{ $session_name }} - {{ $term }}</div>
                </div>

                <div class="info-section">
                    <table class="info-table">
                        <tr>
                            <td width="50%">
                                <span class="info-label">Name:</span> {{ strtoupper($notice['student']->name) }}<br>
                                <span class="info-label">Reg No:</span> {{ $notice['student']->admission_number }}<br>
                                <span class="info-label">Class:</span> {{ $notice['student']->schoolClass->name ?? 'N/A' }}
                            </td>
                            <td width="50%">
                                <span class="info-label">Account No.:</span> <b>{{ $notice['student']->virtualAccount->account_number ?? 'N/A' }}</b><br>
                                <span class="info-label">Account Name:</span> {{ $notice['student']->virtualAccount->account_name ?? 'N/A' }}<br>
                                <span class="info-label">Bank Name:</span> {{ $notice['student']->virtualAccount->bank_name ?? 'N/A' }}
                            </td>
                        </tr>
                    </table>
                </div>

                <table class="fees-table">
                    <thead>
                        <tr>
                            <th width="20%">Session</th>
                            <th width="20%">Term</th>
                            <th>Fee Detail</th>
                            <th width="20%">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($notice['fees'] as $fee)
                            <tr>
                                <td>{{ $session_name }}</td>
                                <td>{{ $term }}</td>
                                <td>{{ $fee['title'] }}</td>
                                <td><span class="currency">&#8358;</span>{{ number_format($fee['amount']) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="amount-due">Amount Due : <span class="currency">&#8358;</span>{{ number_format($notice['total_due']) }}</div>
                    <div class="footer">
                        Powered by SACI ICT
                    </div>
                </div>
            </div>