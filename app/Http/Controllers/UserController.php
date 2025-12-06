<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_users')->only(['index', 'show']);
        $this->middleware('permission:create_user')->only(['create', 'store']);
        $this->middleware('permission:edit_user')->only(['edit', 'update']);
        $this->middleware('permission:delete_user')->only('destroy');
    }

    public function index(Request $request): Response
    {
        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->branch_id, function ($query, $branchId) {
                $query->where('branch_id', $branchId);
            })
            ->with(['branch:id,name,code', 'roles:id,name'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branches = Branch::active()->get(['id', 'name', 'code']);
        $roles = Role::all(['id', 'name']);

        return Inertia::render('users/index', [
            'users' => $users,
            'branches' => $branches,
            'roles' => $roles,
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function create(): Response
    {
        $branches = Branch::active()->get(['id', 'name', 'code']);
        $roles = Role::all(['id', 'name']);

        return Inertia::render('users/create', [
            'branches' => $branches,
            'roles' => $roles,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'branch_id' => $validated['branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    public function show(User $user): Response
    {
        $user->load(['branch', 'roles']);

        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('roles');
        $branches = Branch::active()->get(['id', 'name', 'code']);
        $roles = Role::all(['id', 'name']);

        return Inertia::render('users/edit', [
            'user' => $user,
            'branches' => $branches,
            'roles' => $roles,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'branch_id' => $validated['branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }
}
