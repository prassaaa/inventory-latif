<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('skip')]
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    // Registration feature is not implemented in this application
    // Users are created by administrators only

    public function test_registration_screen_can_be_rendered()
    {
        $this->markTestSkipped('Registration feature is not implemented');
    }

    public function test_new_users_can_register()
    {
        $this->markTestSkipped('Registration feature is not implemented');
    }
}
