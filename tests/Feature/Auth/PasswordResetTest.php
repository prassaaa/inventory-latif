<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('skip')]
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    // Password reset feature is not implemented in this application
    // Users are created by administrators only

    public function test_reset_password_link_screen_can_be_rendered()
    {
        $this->markTestSkipped('Password reset feature is not implemented');
    }

    public function test_reset_password_link_can_be_requested()
    {
        $this->markTestSkipped('Password reset feature is not implemented');
    }

    public function test_reset_password_screen_can_be_rendered()
    {
        $this->markTestSkipped('Password reset feature is not implemented');
    }

    public function test_password_can_be_reset_with_valid_token()
    {
        $this->markTestSkipped('Password reset feature is not implemented');
    }

    public function test_password_cannot_be_reset_with_invalid_token(): void
    {
        $this->markTestSkipped('Password reset feature is not implemented');
    }
}
