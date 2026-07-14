<?php

namespace App\Providers;

use App\Services\Sms\SmsService;
use App\Services\Sms\SmsProviderInterface;
use App\Services\Sms\TermiiProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind the SMS provider
        $this->app->bind(SmsProviderInterface::class, function ($app) {
            return new TermiiProvider();
        });

        // Bind the SMS service as singleton
        $this->app->singleton(SmsService::class, function ($app) {
            return new SmsService($app->make(SmsProviderInterface::class));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);
    }
}
