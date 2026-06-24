import { supabase } from '@/lib/supabase';

export async function registerDevice(
  deviceId: string,
): Promise<{ conflict: boolean; existingSignedInAt: string | null }> {
  try {
    const { data, error } = await supabase.rpc('register_device', {
      p_device_id: deviceId,
    });
    if (error) {
      console.error('registerDevice RPC error:', error.message);
      return { conflict: false, existingSignedInAt: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      conflict: row?.conflict === true,
      existingSignedInAt: row?.existing_signed_in_at ?? null,
    };
  } catch (e) {
    console.error('registerDevice failed:', e);
    return { conflict: false, existingSignedInAt: null };
  }
}

export async function forceDeviceTakeover(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('force_device_takeover', {
      p_device_id: deviceId,
    });
    if (error) {
      console.error('forceDeviceTakeover RPC error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('forceDeviceTakeover failed:', e);
    return false;
  }
}

export async function checkDeviceActive(deviceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_device_active', {
      p_device_id: deviceId,
    });
    if (error) {
      console.error('checkDeviceActive RPC error:', error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error('checkDeviceActive failed:', e);
    return true;
  }
}
