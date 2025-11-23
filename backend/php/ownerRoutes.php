<?php
/**
 * Owner Routes Handler
 * Handles system owner API endpoints for managing organizations, users, subscriptions, and analytics
 * 
 * Usage: Include this file in your API router and route /owner/* to this handler
 * 
 * Required database tables:
 * - users (with is_system_owner, organization_id, plan, subscription_status columns)
 * - organizations (with id, name, subscription_tier, subscription_status, max_users columns)
 */

require_once __DIR__ . '/../config.php'; // Adjust path as needed

/**
 * Check if user is system owner
 */
function isSystemOwner($conn, $userId) {
    if (!$userId) {
        error_log("Owner API: No user ID provided");
        return false;
    }
    
    try {
        // Check if is_system_owner column exists
        $checkCol = $conn->query("SHOW COLUMNS FROM users LIKE 'is_system_owner'");
        if (!$checkCol) {
            error_log("Owner API: Error checking for is_system_owner column: " . $conn->error);
            return false;
        }
        
        if ($checkCol->num_rows === 0) {
            error_log("Owner API: is_system_owner column does not exist in users table");
            return false;
        }
        
        $stmt = $conn->prepare("SELECT is_system_owner FROM users WHERE id = ?");
        if (!$stmt) {
            error_log("Owner API: Error preparing statement: " . $conn->error);
            return false;
        }
        
        $stmt->bind_param("s", $userId);
        if (!$stmt->execute()) {
            error_log("Owner API: Error executing statement: " . $stmt->error);
            $stmt->close();
            return false;
        }
        
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $isOwner = (bool)$row['is_system_owner'];
            error_log("Owner API: User $userId is_system_owner = " . ($isOwner ? 'true' : 'false'));
            $stmt->close();
            return $isOwner;
        }
        
        error_log("Owner API: User $userId not found");
        $stmt->close();
        return false;
    } catch (Exception $e) {
        error_log("Owner API: Exception in isSystemOwner: " . $e->getMessage());
        return false;
    }
}

/**
 * Handle owner routes
 * @param mysqli $conn - Database connection
 * @param string $method - HTTP method (GET, POST, PUT, DELETE)
 * @param array $pathParts - Path parts array (e.g., ['owner', 'organizations'])
 * @param array $data - Request data
 * @param string|null $currentUserId - Current user ID from request
 */
function handleOwnerRoute($conn, $method, $pathParts, $data, $currentUserId = null) {
    // Get action from path (e.g., /owner/organizations -> 'organizations')
    $action = $pathParts[1] ?? '';
    $id = $pathParts[2] ?? null;
    
    // Verify system owner access
    if (!$currentUserId) {
        sendJSON([
            'error' => 'Authentication required',
            'message' => 'Please provide current_user_id in request'
        ], 401);
    }
    
    $isOwner = isSystemOwner($conn, $currentUserId);
    if (!$isOwner) {
        sendJSON([
            'error' => 'Access denied. System owner privileges required.',
            'current_user_id' => $currentUserId,
            'message' => 'Please ensure the is_system_owner column exists and your account is set as system owner.'
        ], 403);
    }
    
    try {
        switch ($method) {
            case 'GET':
                if ($action === 'organizations') {
                    return handleGetOrganizations($conn);
                } elseif ($action === 'users') {
                    return handleGetUsers($conn);
                } elseif ($action === 'analytics') {
                    return handleGetAnalytics($conn);
                } elseif ($action === 'subscriptions') {
                    return handleGetSubscriptions($conn);
                } else {
                    sendJSON(['error' => 'Action not found'], 404);
                }
                break;
                
            case 'POST':
                if ($action === 'organizations') {
                    return handleCreateOrganization($conn, $data);
                } elseif ($action === 'update-subscription') {
                    return handleUpdateSubscription($conn, $data);
                } else {
                    sendJSON(['error' => 'Action not found'], 404);
                }
                break;
                
            case 'PUT':
                if ($action === 'organizations' && $id) {
                    return handleUpdateOrganization($conn, $id, $data);
                } else {
                    sendJSON(['error' => 'Action not found'], 404);
                }
                break;
                
            case 'DELETE':
                if ($action === 'organizations' && $id) {
                    return handleDeleteOrganization($conn, $id);
                } else {
                    sendJSON(['error' => 'Action not found'], 404);
                }
                break;
                
            default:
                sendJSON(['error' => 'Method not allowed'], 405);
        }
    } catch (Exception $e) {
        error_log("Owner API error: " . $e->getMessage());
        sendJSON(['error' => 'Server error', 'message' => $e->getMessage()], 500);
    }
}

/**
 * Get all organizations
 */
function handleGetOrganizations($conn) {
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    // Check if organization_id column exists in users
    $checkCol = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
    $hasOrgId = $checkCol->num_rows > 0;
    
    if ($hasOrgId) {
        $stmt = $conn->prepare("
            SELECT o.*, 
                   (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as current_user_count
            FROM organizations o
            ORDER BY o.created_at DESC
        ");
    } else {
        // Fallback if organization_id doesn't exist
        $stmt = $conn->prepare("
            SELECT o.*, 0 as current_user_count
            FROM organizations o
            ORDER BY o.created_at DESC
        ");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $organizations = [];
    while ($row = $result->fetch_assoc()) {
        $organizations[] = $row;
    }
    sendJSON($organizations);
}

/**
 * Get all users
 */
function handleGetUsers($conn) {
    // Check if organization_id column exists
    $checkOrgId = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
    $hasOrgId = $checkOrgId->num_rows > 0;
    
    // Check if plan column exists
    $checkPlan = $conn->query("SHOW COLUMNS FROM users LIKE 'plan'");
    $hasPlan = $checkPlan->num_rows > 0;
    
    // Build SELECT fields
    $selectFields = ['u.id', 'u.email', 'u.name', 'u.role', 'u.created_at'];
    
    if ($hasOrgId) {
        $selectFields[] = 'u.organization_id';
    }
    
    // Check for organization admin and system owner columns
    $checkOrgAdmin = $conn->query("SHOW COLUMNS FROM users LIKE 'is_organization_admin'");
    $hasOrgAdmin = $checkOrgAdmin->num_rows > 0;
    if ($hasOrgAdmin) {
        $selectFields[] = 'u.is_organization_admin';
    }
    
    $checkSystemOwner = $conn->query("SHOW COLUMNS FROM users LIKE 'is_system_owner'");
    $hasSystemOwner = $checkSystemOwner->num_rows > 0;
    if ($hasSystemOwner) {
        $selectFields[] = 'u.is_system_owner';
    }
    
    if ($hasPlan) {
        $selectFields[] = 'u.plan';
    }
    
    $checkSubscriptionStatus = $conn->query("SHOW COLUMNS FROM users LIKE 'subscription_status'");
    $hasSubscriptionStatus = $checkSubscriptionStatus->num_rows > 0;
    if ($hasSubscriptionStatus) {
        $selectFields[] = 'u.subscription_status';
    }
    
    // Build query with optional organization join
    $query = "SELECT " . implode(', ', $selectFields);
    
    if ($hasOrgId) {
        $query .= ", o.name as organization_name, o.subscription_tier";
        $query .= " FROM users u";
        $query .= " LEFT JOIN organizations o ON u.organization_id = o.id";
    } else {
        $query .= " FROM users u";
    }
    
    $query .= " ORDER BY u.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    sendJSON($users);
}

/**
 * Get system analytics
 */
function handleGetAnalytics($conn) {
    $analytics = [];
    
    // Check if organizations table exists
    $checkOrgsTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    $hasOrgsTable = $checkOrgsTable->num_rows > 0;
    
    // Total organizations
    if ($hasOrgsTable) {
        $result = $conn->query("SELECT COUNT(*) as count FROM organizations");
        $analytics['total_organizations'] = (int)$result->fetch_assoc()['count'];
    } else {
        $analytics['total_organizations'] = 0;
    }
    
    // Total users
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    $analytics['total_users'] = (int)$result->fetch_assoc()['count'];
    
    // Users by subscription tier (from users.plan or organizations.subscription_tier)
    $checkPlan = $conn->query("SHOW COLUMNS FROM users LIKE 'plan'");
    $hasPlan = $checkPlan->num_rows > 0;
    
    if ($hasPlan) {
        $result = $conn->query("SELECT plan, COUNT(*) as user_count FROM users GROUP BY plan");
        $analytics['users_by_tier'] = [];
        while ($row = $result->fetch_assoc()) {
            $analytics['users_by_tier'][$row['plan']] = (int)$row['user_count'];
        }
    } elseif ($hasOrgsTable) {
        $checkOrgId = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
        $hasOrgId = $checkOrgId->num_rows > 0;
        if ($hasOrgId) {
            $result = $conn->query("
                SELECT o.subscription_tier, COUNT(DISTINCT u.id) as user_count
                FROM organizations o
                LEFT JOIN users u ON u.organization_id = o.id
                GROUP BY o.subscription_tier
            ");
            $analytics['users_by_tier'] = [];
            while ($row = $result->fetch_assoc()) {
                $analytics['users_by_tier'][$row['subscription_tier']] = (int)$row['user_count'];
            }
        }
    }
    
    // Organizations by tier
    if ($hasOrgsTable) {
        $result = $conn->query("
            SELECT subscription_tier, COUNT(*) as count
            FROM organizations
            GROUP BY subscription_tier
        ");
        $analytics['organizations_by_tier'] = [];
        while ($row = $result->fetch_assoc()) {
            $analytics['organizations_by_tier'][$row['subscription_tier']] = (int)$row['count'];
        }
    }
    
    // Recent signups (last 30 days)
    $result = $conn->query("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $analytics['recent_signups_30d'] = (int)$result->fetch_assoc()['count'];
    
    // Active organizations (with users in last 30 days)
    if ($hasOrgsTable) {
        $checkOrgId = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
        $hasOrgId = $checkOrgId->num_rows > 0;
        if ($hasOrgId) {
            $result = $conn->query("
                SELECT COUNT(DISTINCT u.organization_id) as count
                FROM users u
                WHERE u.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND u.organization_id IS NOT NULL
            ");
            $analytics['active_organizations_30d'] = (int)$result->fetch_assoc()['count'];
        } else {
            $analytics['active_organizations_30d'] = 0;
        }
    } else {
        $analytics['active_organizations_30d'] = 0;
    }
    
    sendJSON($analytics);
}

/**
 * Get all subscriptions
 */
function handleGetSubscriptions($conn) {
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    // Check if organization_id column exists in users
    $checkCol = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
    $hasOrgId = $checkCol->num_rows > 0;
    
    if ($hasOrgId) {
        $stmt = $conn->prepare("
            SELECT o.*, 
                   (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as current_user_count
            FROM organizations o
            ORDER BY o.created_at DESC
        ");
    } else {
        $stmt = $conn->prepare("
            SELECT o.*, 0 as current_user_count
            FROM organizations o
            ORDER BY o.created_at DESC
        ");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $subscriptions = [];
    while ($row = $result->fetch_assoc()) {
        $subscriptions[] = $row;
    }
    sendJSON($subscriptions);
}

/**
 * Create organization
 */
function handleCreateOrganization($conn, $data) {
    $missing = validateRequired($data, ['name']);
    if (!empty($missing)) {
        sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
    }
    
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    $orgId = 'org_' . time() . '_' . rand(1000, 9999);
    $name = $conn->real_escape_string($data['name']);
    $tier = $conn->real_escape_string($data['subscription_tier'] ?? 'free');
    $maxUsers = isset($data['max_users']) ? (int)$data['max_users'] : 1;
    
    // Check what columns exist in organizations table
    $checkCols = $conn->query("SHOW COLUMNS FROM organizations");
    $columns = [];
    while ($col = $checkCols->fetch_assoc()) {
        $columns[] = $col['Field'];
    }
    
    $insertFields = ['id', 'name'];
    $insertValues = ['?', '?'];
    $params = [$orgId, $name];
    $types = "ss";
    
    if (in_array('subscription_tier', $columns)) {
        $insertFields[] = 'subscription_tier';
        $insertValues[] = '?';
        $params[] = $tier;
        $types .= "s";
    }
    
    if (in_array('max_users', $columns)) {
        $insertFields[] = 'max_users';
        $insertValues[] = '?';
        $params[] = $maxUsers;
        $types .= "i";
    }
    
    if (in_array('subscription_status', $columns)) {
        $insertFields[] = 'subscription_status';
        $insertValues[] = '?';
        $params[] = 'active';
        $types .= "s";
    }
    
    $sql = "INSERT INTO organizations (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendJSON(['success' => true, 'id' => $orgId], 201);
    } else {
        sendJSON(['error' => 'Failed to create organization', 'message' => $stmt->error], 500);
    }
}

/**
 * Update organization
 */
function handleUpdateOrganization($conn, $id, $data) {
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    $name = isset($data['name']) ? $conn->real_escape_string($data['name']) : null;
    $tier = isset($data['subscription_tier']) ? $conn->real_escape_string($data['subscription_tier']) : null;
    $maxUsers = isset($data['max_users']) ? (int)$data['max_users'] : null;
    $status = isset($data['subscription_status']) ? $conn->real_escape_string($data['subscription_status']) : null;
    
    $updateFields = [];
    $params = [];
    $types = "";
    
    if ($name !== null) {
        $updateFields[] = "name = ?";
        $params[] = $name;
        $types .= "s";
    }
    if ($tier !== null) {
        $updateFields[] = "subscription_tier = ?";
        $params[] = $tier;
        $types .= "s";
    }
    if ($maxUsers !== null) {
        $updateFields[] = "max_users = ?";
        $params[] = $maxUsers;
        $types .= "i";
    }
    if ($status !== null) {
        $updateFields[] = "subscription_status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if (empty($updateFields)) {
        sendJSON(['error' => 'No fields to update'], 400);
    }
    
    $params[] = $id;
    $types .= "s";
    
    $sql = "UPDATE organizations SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendJSON(['success' => true, 'message' => 'Organization updated successfully']);
    } else {
        sendJSON(['error' => 'Failed to update organization', 'message' => $stmt->error], 500);
    }
}

/**
 * Delete organization
 */
function handleDeleteOrganization($conn, $id) {
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    $stmt = $conn->prepare("DELETE FROM organizations WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        sendJSON(['success' => true, 'message' => 'Organization deleted successfully']);
    } else {
        sendJSON(['error' => 'Failed to delete organization', 'message' => $stmt->error], 500);
    }
}

/**
 * Update subscription
 */
function handleUpdateSubscription($conn, $data) {
    $missing = validateRequired($data, ['organization_id', 'subscription_tier']);
    if (!empty($missing)) {
        sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
    }
    
    // Check if organizations table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'organizations'");
    if ($checkTable->num_rows === 0) {
        sendJSON(['error' => 'Organizations table not found'], 500);
    }
    
    $orgId = $conn->real_escape_string($data['organization_id']);
    $tier = $conn->real_escape_string($data['subscription_tier']);
    $maxUsers = isset($data['max_users']) ? (int)$data['max_users'] : null;
    $status = isset($data['subscription_status']) ? $conn->real_escape_string($data['subscription_status']) : 'active';
    
    $updateFields = ["subscription_tier = ?", "subscription_status = ?"];
    $params = [$tier, $status];
    $types = "ss";
    
    if ($maxUsers !== null) {
        $updateFields[] = "max_users = ?";
        $params[] = $maxUsers;
        $types .= "i";
    }
    
    $params[] = $orgId;
    $types .= "s";
    
    $sql = "UPDATE organizations SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendJSON(['success' => true, 'message' => 'Subscription updated successfully']);
    } else {
        sendJSON(['error' => 'Failed to update subscription', 'message' => $stmt->error], 500);
    }
}

?>

