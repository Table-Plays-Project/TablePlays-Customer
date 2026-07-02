import { supabase } from '@/lib/supabase';

export type FriendStatus = 'pending' | 'accepted';

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  requested_by: string | null;
  status: FriendStatus;
  created_at: string;
  friend_name: string | null;
  friend_avatar_id: string | null;
};

export type FriendError = {
  message: string;
  code: string | null;
};

export async function getFriends(): Promise<{
  friends: Friend[];
  error: FriendError | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { friends: [], error: { message: 'Not authenticated.', code: null } };

    const { data, error } = await supabase
      .from('friends')
      .select('id, user_id, friend_id, requested_by, status, created_at')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return { friends: [], error: { message: error.message, code: error.code } };
    }

    const friendUserIds = (data ?? []).map((f) =>
      f.user_id === user.id ? f.friend_id : f.user_id,
    );

    const profileMap = new Map<string, { first_name: string | null; full_name: string | null; email: string | null; avatar_id: string | null }>();
    if (friendUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, full_name, email, avatar_id')
        .in('user_id', friendUserIds);
      (profiles ?? []).forEach((p) => {
        const row = p as { user_id: string; first_name: string | null; full_name: string | null; email: string | null; avatar_id: string | null };
        profileMap.set(row.user_id, {
          first_name: row.first_name,
          full_name: row.full_name,
          email: row.email,
          avatar_id: row.avatar_id,
        });
      });
    }

    const friends: Friend[] = (data ?? []).map((f) => {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
      const profile = profileMap.get(otherId);
      const displayName = profile?.first_name
        || profile?.full_name
        || (profile?.email ? profile.email.split('@')[0] : null);
      return {
        ...f,
        status: f.status as FriendStatus,
        friend_name: displayName,
        friend_avatar_id: profile?.avatar_id ?? null,
      };
    });

    return { friends, error: null };
  } catch (e) {
    console.error('getFriends failed:', e);
    return { friends: [], error: { message: 'Failed to load friends.', code: null } };
  }
}

export async function sendFriendRequest(
  friendEmail: string,
): Promise<{ error: FriendError | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated.', code: null } };

    const { data: profiles, error: searchErr } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .eq('email', friendEmail.trim().toLowerCase())
      .limit(1);

    if (searchErr) {
      return { error: { message: searchErr.message, code: searchErr.code } };
    }
    if (!profiles || profiles.length === 0) {
      return { error: { message: 'No user found with that email.', code: null } };
    }

    const friendId = profiles[0].user_id;
    if (friendId === user.id) {
      return { error: { message: 'You cannot add yourself.', code: null } };
    }

    // Canonical order: smaller UUID = user_id, larger = friend_id
    const [smallId, largeId] = user.id < friendId
      ? [user.id, friendId]
      : [friendId, user.id];

    const { data: existing } = await supabase
      .from('friends')
      .select('id')
      .eq('user_id', smallId)
      .eq('friend_id', largeId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: { message: 'Friend request already exists.', code: null } };
    }

    const { error: insertErr } = await supabase
      .from('friends')
      .insert({
        user_id: smallId,
        friend_id: largeId,
        requested_by: user.id,
        status: 'pending',
      });

    if (insertErr) {
      return { error: { message: insertErr.message, code: insertErr.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('sendFriendRequest failed:', e);
    return { error: { message: 'Failed to send request.', code: null } };
  }
}

export async function acceptFriendRequest(
  friendshipId: string,
): Promise<{ error: FriendError | null }> {
  try {
    const { error } = await supabase.rpc('accept_friend_request', {
      p_friendship_id: friendshipId,
    });
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('acceptFriendRequest failed:', e);
    return { error: { message: 'Failed to accept request.', code: null } };
  }
}

export async function removeFriend(
  friendshipId: string,
): Promise<{ error: FriendError | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated.', code: null } };

    // Scope to rows the caller is actually part of — defense-in-depth on top
    // of the RLS policy so a leaked friendshipId can't be used to delete
    // someone else's friendship.
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('removeFriend failed:', e);
    return { error: { message: 'Failed to remove friend.', code: null } };
  }
}

export async function inviteFriendToSession(
  sessionId: string,
  friendUserId: string,
): Promise<{ error: FriendError | null }> {
  try {
    const { error } = await supabase.rpc('invite_friend_to_session', {
      p_session_id: sessionId,
      p_friend_user_id: friendUserId,
    });
    if (error) {
      const msg = error.message.includes('ALREADY_IN_SESSION')
        ? 'This friend is already in the game.'
        : error.message.includes('ALREADY_INVITED')
          ? 'Invite already sent.'
          : error.message.includes('NOT_FRIENDS')
            ? 'You can only invite friends.'
            : error.message.includes('SESSION_FULL')
              ? 'The game is full.'
              : error.message;
      return { error: { message: msg, code: error.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('inviteFriendToSession failed:', e);
    return { error: { message: 'Failed to invite friend.', code: null } };
  }
}

export type GameInvite = {
  id: string;
  session_id: string;
  inviter_id: string;
  room_code: string;
  inviter_name: string | null;
  created_at: string;
};

export async function getPendingInvites(): Promise<{
  invites: GameInvite[];
  error: FriendError | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { invites: [], error: null };

    const { data, error } = await supabase
      .from('game_invites')
      .select('id, session_id, inviter_id, room_code, created_at')
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return { invites: [], error: { message: error.message, code: error.code } };
    }

    const inviterIds = (data ?? []).map((i) => i.inviter_id);
    const nameMap = new Map<string, string>();
    if (inviterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', inviterIds);
      (profiles ?? []).forEach((p) => {
        if (p.first_name) nameMap.set(p.user_id, p.first_name);
      });
    }

    const invites: GameInvite[] = (data ?? []).map((i) => ({
      ...i,
      inviter_name: nameMap.get(i.inviter_id) ?? null,
    }));

    return { invites, error: null };
  } catch (e) {
    console.error('getPendingInvites failed:', e);
    return { invites: [], error: { message: 'Failed to load invites.', code: null } };
  }
}

export async function respondToInvite(
  inviteId: string,
  accept: boolean,
): Promise<{ error: FriendError | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated.', code: null } };

    // Filter by invitee_id so only the intended recipient can accept/decline.
    // This is defense-in-depth on top of the RLS policy — a leaked invite UUID
    // cannot be used by a third party to accept or decline on someone's behalf.
    const { error } = await supabase
      .from('game_invites')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', inviteId)
      .eq('invitee_id', user.id);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('respondToInvite failed:', e);
    return { error: { message: 'Failed to respond to invite.', code: null } };
  }
}
