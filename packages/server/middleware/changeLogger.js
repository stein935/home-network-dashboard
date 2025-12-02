const ChangeLog = require('../models/ChangeLog');

/**
 * Middleware factory to log changes to entities
 * @param {Object} options - Configuration options
 * @param {string} options.action - Action type: 'create', 'update', 'delete', or 'trigger'
 * @param {string} options.entity - Entity type: 'service', 'section', 'note', 'user', or 'data_function'
 * @param {Function} options.getEntityInfo - Function to extract entity info from req/res
 * @param {Function} options.getBeforeState - Optional function to fetch 'before' state for updates
 * @returns {Function} Express middleware function
 */
function logChange({ action, entity, getEntityInfo, getBeforeState }) {
  return async (req, res, next) => {
    // Capture before state for update and delete operations
    let beforeState = null;
    if ((action === 'update' || action === 'delete') && getBeforeState) {
      try {
        beforeState = await getBeforeState(req);
      } catch (error) {
        console.error('Error capturing before state for change log:', error);
      }
    }

    // Flag to ensure we only log once per request
    let hasLogged = false;

    // Intercept res.json and res.send to log after successful response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const logAfterSuccess = (data) => {
      // Only log if response was successful (2xx status code) and we haven't logged yet
      if (!hasLogged && res.statusCode >= 200 && res.statusCode < 300) {
        hasLogged = true;
        try {
          // Extract entity information
          const entityInfo = getEntityInfo(req, data, beforeState);

          // Build details object
          let details = {};

          if (action === 'create') {
            // For create, include the new entity data
            details = {
              created: entityInfo.newData || {},
            };
          } else if (action === 'update') {
            // For update, include before/after comparison
            details = {
              before: beforeState || {},
              after: entityInfo.newData || {},
              changes: entityInfo.changes || {},
            };
          } else if (action === 'delete') {
            // For delete, include the deleted entity data
            details = {
              deleted: beforeState || {},
            };
          } else if (action === 'trigger') {
            // For trigger, include execution details
            details = entityInfo.details || {};
          }

          // Log the change (async, don't block response)
          ChangeLog.create({
            userId: req.user.id,
            userEmail: req.user.email,
            userName: req.user.name,
            actionType: action,
            entityType: entity,
            entityId: entityInfo.id,
            entityName: entityInfo.name,
            details,
          });
        } catch (error) {
          // Log error but don't fail the request
          console.error('Error logging change:', error);
        }
      }
    };

    // Override res.json
    res.json = function (data) {
      logAfterSuccess(data);
      return originalJson(data);
    };

    // Override res.send (used by res.status(204).send() for DELETE)
    res.send = function (data) {
      logAfterSuccess(data);
      return originalSend(data);
    };

    next();
  };
}

/**
 * Helper function to compute changes between before and after states
 * @param {Object} before - Before state
 * @param {Object} after - After state
 * @returns {Object} Object with changed fields
 */
function getChangedFields(before, after) {
  const changes = {};

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    // Skip internal fields
    if (['id', 'created_at', 'updated_at'].includes(key)) {
      continue;
    }

    const beforeValue = before[key];
    const afterValue = after[key];

    // Detect changes (including type changes)
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes[key] = {
        from: beforeValue,
        to: afterValue,
      };
    }
  }

  return changes;
}

module.exports = { logChange, getChangedFields };
