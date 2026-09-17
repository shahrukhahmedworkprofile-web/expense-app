<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExpenseController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::get('/csrf-token', function () {
    $token = Str::random(64);

    return response()->noContent()->withCookie(
        cookie('csrf_token', $token, 60, '/', null, false, false, false, 'lax') 
    );
    // return response()->json([
    //     'csrf_token' => $token,
    // ])->withCookie(
    //     cookie( 'csrf_token', $token, 60, '/', null, false, false, false, 'lax')
    // );
});
Route::middleware('csrf')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refresh']);

        Route::middleware('access.token')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('access.token')->group(function () {
        Route::apiResource('expenses', ExpenseController::class);
    });
});