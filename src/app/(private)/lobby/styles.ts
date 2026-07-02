import { StyleSheet } from 'react-native';

const CORAL = '#F4736A';
const CORAL_DARK = '#E85D4A';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    alignItems: 'center' as const,
  },
  bgShape: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.1)',
  },

  // ── Back button ──
  backBtn: {
    alignSelf: 'flex-start' as const,
    marginTop: 46,
    marginBottom: 10,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // ── QR Card ──
  qrCard: {
    width: 190,
    height: 190,
    borderRadius: 28,
    backgroundColor: '#F07A72',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(150,230,120,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },

  // ── Room Code ──
  roomLabel: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 36,
    lineHeight: 44,
    color: CORAL,
    letterSpacing: 3,
    textAlign: 'center' as const,
    marginBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  roomCode: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    lineHeight: 40,
    color: CORAL,
    letterSpacing: 5,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
  },

  // ── Bill Input ──
  billRow: {
    width: '100%' as const,
    marginBottom: 16,
  },
  billInput: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  billIcon: {
    marginRight: 8,
  },
  billText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontFamily: 'DMSans_400Regular',
    paddingVertical: 0,
  },
  billDoneBtn: {
    backgroundColor: CORAL,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  billDoneText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: WHITE,
  },
  optionalText: {
    alignSelf: 'flex-end' as const,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 2,
    fontFamily: 'Baloo2_800ExtraBold',
    marginBottom: 4,
    marginRight: 4,
  },

  // ── Players Card ──
  playersCard: {
    width: '100%' as const,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(210,160,60,0.45)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    overflow: 'visible' as const,
  },
  playersLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#E8553A',
    letterSpacing: 1,
    textShadowColor: 'rgba(230,100,50,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 10,
  },
  loadingIndicator: {
    marginVertical: 16,
  },

  // ── Player Row ──
  rowWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
    overflow: 'visible' as const,
  },
  playerRow: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 14,
    backgroundColor: '#F4736A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,220,100,0.6)',
  },
  hostBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hostBadgeText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 13,
    color: '#F4736A',
    letterSpacing: 0.5,
  },
  botBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  botBadgeText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 13,
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  playerRowOffline: {},
  playerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: WHITE,
  },
  offlineBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  offlineBadgeText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 13,
    color: '#DC2626',
    letterSpacing: 0.5,
  },

  // ── Toggle Pill ──
  togglePill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    borderRadius: 999,
    width: 60,
    height: 30,
    paddingHorizontal: 4,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E040A0',
    shadowColor: '#E040A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 4,
  },
  toggleText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    marginLeft: 3,
    letterSpacing: 0.5,
  },

  // ── Buttons ──
  startBtn: {
    borderRadius: 999,
    height: 58,
    width: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: CORAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  btnStar: {
    width: 44,
    height: 44,
    marginRight: 4,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: WHITE,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addBtn: {
    width: '100%' as const,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  addBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: WHITE,
    letterSpacing: 1,
  },

  // ── Waiting (non-host) ──
  waitingWrap: {
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  waitingStar: {
    width: 56,
    height: 56,
  },

  // ── Error ──
  errorBanner: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    width: '100%' as const,
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: WHITE,
    flex: 1,
  },
});

export default styles;
