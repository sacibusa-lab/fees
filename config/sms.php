<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default SMS Provider
    |--------------------------------------------------------------------------
    */
    'default' => env('SMS_PROVIDER', 'termii'),

    /*
    |--------------------------------------------------------------------------
    | SMS Providers
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'termii' => [
            'api_key' => env('TERMII_API_KEY'),
            'sender_id' => env('TERMII_SENDER_ID'),
            'url' => env('TERMII_BASE_URL', 'https://api.termii.com/api'),
        ],

        // Additional providers can be added here
    ],

    /*
    |--------------------------------------------------------------------------
    | Default SMS Settings
    |--------------------------------------------------------------------------
    */
    'default_sender_id' => env('SMS_SENDER_ID', 'SchoolAlert'),
    'enabled' => env('SMS_ENABLED', false),
];
