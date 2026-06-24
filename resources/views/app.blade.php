<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <title>{{ $page['props']['institution']['name'] ?? config('app.name', 'Fees Collection') }}</title>
        @if(isset($page['props']['institution']['favicon']))
            <link rel="icon" type="image/x-icon" href="{{ $page['props']['institution']['favicon'] }}">
        @endif
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
