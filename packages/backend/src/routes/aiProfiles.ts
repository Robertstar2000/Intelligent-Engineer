import { Router } from 'express';
import { AIProfileService } from '../services/AIProfileService';
import { authenticateToken } from '../middleware/auth';
import { TuningSettings } from '@shared/types';

const router = Router();
const aiProfileService = new AIProfileService();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/ai-profiles
 * Get all AI profiles accessible to the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profiles = await aiProfileService.getUserProfiles(userId, organizationId);
    res.json(profiles);
  } catch (error: any) {
    console.error('Error fetching AI profiles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-profiles/:id
 * Get a specific AI profile by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await aiProfileService.getProfile(id, userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'AI profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching AI profile:', error);
    res.status(403).json({ error: error.message });
  }
});

/**
 * POST /api/ai-profiles
 * Create a new AI profile
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, tuningSettings } = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !tuningSettings) {
      return res.status(400).json({ error: 'Name and tuning settings are required' });
    }

    const profile = await aiProfileService.createProfile(
      name,
      description || '',
      tuningSettings as TuningSettings,
      userId,
      organizationId
    );

    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error creating AI profile:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/ai-profiles/:id
 * Update an existing AI profile
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await aiProfileService.updateProfile(id, updates, userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'AI profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Error updating AI profile:', error);
    res.status(403).json({ error: error.message });
  }
});

/**
 * DELETE /api/ai-profiles/:id
 * Delete an AI profile
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const deleted = await aiProfileService.deleteProfile(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'AI profile not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting AI profile:', error);
    res.status(403).json({ error: error.message });
  }
});

/**
 * POST /api/ai-profiles/:id/share
 * Share an AI profile with organization
 */
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await aiProfileService.shareProfile(id, userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'AI profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Error sharing AI profile:', error);
    res.status(403).json({ error: error.message });
  }
});

/**
 * GET /api/ai-profiles/:id/export
 * Export an AI profile configuration
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exportData = await aiProfileService.exportProfile(id, userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-profile-${id}.json"`);
    res.json(exportData);
  } catch (error: any) {
    console.error('Error exporting AI profile:', error);
    res.status(403).json({ error: error.message });
  }
});

/**
 * POST /api/ai-profiles/import
 * Import an AI profile configuration
 */
router.post('/import', async (req, res) => {
  try {
    const profileData = req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await aiProfileService.importProfile(profileData, userId, organizationId);
    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error importing AI profile:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/ai-profiles/:id/usage
 * Record profile usage
 */
router.post('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await aiProfileService.recordUsage(id, userId, rating);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error recording profile usage:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/ai-profiles/built-in
 * Get built-in AI profiles
 */
router.get('/built-in', async (req, res) => {
  try {
    const profiles = await aiProfileService.getBuiltInProfiles();
    res.json(profiles);
  } catch (error: any) {
    console.error('Error fetching built-in AI profiles:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;