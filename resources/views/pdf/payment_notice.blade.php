<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>

    <style>
        @page {
            size: A4;
            margin: 0.3cm;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 0;
        }

        table.page-table {
            width: 100%;
            border-collapse: collapse;
        }

        td.column {
            width: 50%;
            vertical-align: top;
            padding: 2mm;
        }

        .notice-card {
            height: 84mm; /* EXACT: 3 per column */
            border: 1px solid #ddd;
            padding: 3mm;
            margin-bottom: 4mm;
            box-sizing: border-box;
            page-break-inside: avoid;
        }

        .header {
            text-align: center;
        }

        .logo {
            width: 70px;
            height: 70px;
        }

        .institution-name {
            font-size: 26px;
            font-weight: bold;
        }

        .notice-label {
            font-size: 16px;
            font-weight: bold;
        }

        .fee-title {
            font-size: 14px;
            margin-bottom: 4px;
        }

         .info-section {
            display: block;
            width: 100%;
            margin-bottom: 5px;
            border: 1px solid #ddd;
            padding: 3px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            font-size: 9px;
            padding-bottom: 3px;
            vertical-align: top;
            line-height: 1.4;
        }
        .info-label {
            font-weight: bold;
            color: #000;
        }

        .fees-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }

        .fees-table th,
        .fees-table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
        }

        .fees-table th {
            font-size: 9px;
        }

        .amount-due {
            text-align: center;
            font-weight: bold;
            margin-top: 5px;
            font-size: 12px;
        }

        .footer {
            text-align: center;
            font-size: 6px;
            margin-top: 2px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>

@foreach($notices->chunk(6) as $pageNotices)

<table class="page-table">
    <tr>
        {{-- LEFT COLUMN --}}
        <td class="column">
            @foreach($pageNotices->slice(0,3) as $notice)
                @include('partials.notice-card', ['notice' => $notice])
            @endforeach
        </td>

        {{-- RIGHT COLUMN --}}
        <td class="column">
            @foreach($pageNotices->slice(3,3) as $notice)
                @include('partials.notice-card', ['notice' => $notice])
            @endforeach
        </td>
    </tr>
</table>

<div class="page-break"></div>

@endforeach

</body>
</html>
