import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Storage bucket name for location images
const IMAGES_BUCKET = 'make-12d1bb49-location-images';

// Initialize storage bucket
async function initializeStorage() {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === IMAGES_BUCKET);
    
    if (!bucketExists) {
      console.log('Creating storage bucket:', IMAGES_BUCKET);
      const { error } = await supabase.storage.createBucket(IMAGES_BUCKET, {
        public: false,
      });
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Storage bucket created successfully');
      }
    } else {
      console.log('Storage bucket already exists:', IMAGES_BUCKET);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/server/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to check environment variables
app.get("/server/debug", (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const hasAnonKey = !!Deno.env.get('SUPABASE_ANON_KEY');
  const hasServiceKey = !!Deno.env.get('SERVICE_ROLE_KEY');
  
  console.log('Debug check - SUPABASE_URL:', supabaseUrl);
  console.log('Debug check - Has ANON_KEY:', hasAnonKey);
  console.log('Debug check - Has SERVICE_KEY:', hasServiceKey);
  
  return c.json({
    supabaseUrl,
    hasAnonKey,
    hasServiceKey,
    anonKeyPrefix: Deno.env.get('SUPABASE_ANON_KEY')?.substring(0, 50),
  });
});

// Dev endpoint to list all users
app.get("/server/dev/users", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ 
      users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name,
        created_at: u.created_at
      }))
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return c.json({ error: 'Error listing users' }, 500);
  }
});

// Dev endpoint to delete a user by email
app.delete("/server/dev/users/:email", async (c) => {
  try {
    const email = c.req.param('email');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    // First find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      return c.json({ error: listError.message }, 500);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      return c.json({ error: deleteError.message }, 500);
    }

    return c.json({ success: true, message: `User ${email} deleted` });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Error deleting user' }, 500);
  }
});

// Test endpoint that doesn't require auth
app.get("/server/test", (c) => {
  return c.json({ message: "Server is working!", timestamp: new Date().toISOString() });
});

// Sign up endpoint
app.post("/server/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Error during user creation:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Sign up error:', error);
    return c.json({ error: 'Error creating user' }, 500);
  }
});

// Get all locations endpoint
app.get("/server/locations", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    const accessToken = authHeader?.split(' ')[1];
    
    if (!accessToken) {
      console.error('No access token provided in Authorization header');
      return c.json({ code: 401, message: 'No access token provided' }, 401);
    }
    
    console.log('Access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    // Use ANON_KEY to validate user tokens, not SERVICE_ROLE_KEY
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError) {
      console.error('Authentication error in /locations:', authError);
      return c.json({ code: 401, message: `Invalid JWT: ${authError.message}` }, 401);
    }
    
    if (!user?.id) {
      console.error('No user found for token');
      return c.json({ code: 401, message: 'Invalid JWT' }, 401);
    }

    console.log('Fetching locations for user:', user.id);
    let locations = await kv.getByPrefix('location:');
    
    // Migrate old format to new format
    locations = locations.map((loc: any) => {
      // If location has old 'contacto' field instead of 'contactos' array
      if (loc.contacto && !loc.contactos) {
        return {
          ...loc,
          contactos: [{ 
            id: crypto.randomUUID(), 
            nombre: loc.contacto, 
            telefono: '', 
            email: '' 
          }],
          images: loc.images || []
        };
      }
      // Ensure images field exists
      if (!loc.images) {
        return { ...loc, images: [] };
      }
      // Ensure contactos field exists
      if (!loc.contactos) {
        return { ...loc, contactos: [] };
      }
      return loc;
    });
    
    console.log('Found locations:', locations.length);
    return c.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return c.json({ error: `Error fetching locations: ${error.message}` }, 500);
  }
});

// Get single location endpoint
app.get("/server/locations/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const location = await kv.get(`location:${id}`);
    
    if (!location) {
      return c.json({ error: 'Location not found' }, 404);
    }
    
    return c.json({ location });
  } catch (error) {
    console.error('Error fetching location:', error);
    return c.json({ error: 'Error fetching location' }, 500);
  }
});

// Create location endpoint
app.post("/server/locations", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const locationData = await c.req.json();
    const id = crypto.randomUUID();
    
    const location = {
      id,
      ...locationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, location);
    return c.json({ success: true, location });
  } catch (error) {
    console.error('Error creating location:', error);
    return c.json({ error: 'Error creating location' }, 500);
  }
});

// Update location endpoint
app.put("/server/locations/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const existingLocation = await kv.get(`location:${id}`);
    
    if (!existingLocation) {
      return c.json({ error: 'Location not found' }, 404);
    }

    const updateData = await c.req.json();
    const location = {
      ...existingLocation,
      ...updateData,
      id, // Preserve ID
      createdAt: existingLocation.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, location);
    return c.json({ success: true, location });
  } catch (error) {
    console.error('Error updating location:', error);
    return c.json({ error: 'Error updating location' }, 500);
  }
});

// Delete location endpoint
app.delete("/server/locations/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    await kv.del(`location:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return c.json({ error: 'Error deleting location' }, 500);
  }
});

// Upload image endpoint
app.post("/server/upload-image", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );
    
    // Validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return c.json({ error: 'Error uploading file' }, 500);
    }

    // Generate signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .createSignedUrl(filePath, 31536000); // 1 year in seconds

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return c.json({ error: 'Error creating signed URL' }, 500);
    }

    return c.json({ 
      success: true, 
      url: urlData.signedUrl,
      filePath 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Error uploading image' }, 500);
  }
});

// Delete image endpoint
app.delete("/server/images/:path", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const filePath = decodeURIComponent(c.req.param('path'));
    
    // Check if file belongs to user
    if (!filePath.startsWith(`${user.id}/`)) {
      return c.json({ error: 'Unauthorized to delete this file' }, 403);
    }

    const { error: deleteError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting file:', deleteError);
      return c.json({ error: 'Error deleting file' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return c.json({ error: 'Error deleting image' }, 500);
  }
});

Deno.serve(app.fetch);