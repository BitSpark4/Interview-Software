import { Player } from '@lottiefiles/react-lottie-player'
import {
  Desktop, Buildings, Bank, Wrench, Heartbeat, GraduationCap, Briefcase,
} from '@phosphor-icons/react'

// CDN URLs — free public animations from lottiefiles
const ANIM = {
  brain:    'https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json',
  confetti: 'https://assets3.lottiefiles.com/packages/lf20_u4yrau84.json',
  trophy:   'https://assets9.lottiefiles.com/packages/lf20_puciaact.json',
  check:    'https://assets7.lottiefiles.com/packages/lf20_jbrw3hcz.json',
  fire:     'https://assets2.lottiefiles.com/packages/lf20_qjosmr4w.json',
  study:    'https://assets9.lottiefiles.com/packages/lf20_pwohahvd.json',
  upload:   'https://assets4.lottiefiles.com/packages/lf20_nij7czs7.json',
  mic:      'https://assets6.lottiefiles.com/packages/lf20_cbrbre30.json',
}

const LottieAnimation = ({
  src,
  width = 200,
  height = 200,
  autoplay = true,
  loop = true,
  speed = 1,
  style = {},
  onComplete = null,
}) => {
  return (
    <Player
      src={src}
      autoplay={autoplay}
      loop={loop}
      speed={speed}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
      onEvent={(event) => {
        if (event === 'complete' && onComplete) onComplete()
      }}
    />
  )
}

export default LottieAnimation

export const BrainLoadingAnimation = ({ size = 80 }) => (
  <LottieAnimation src={ANIM.brain} width={size} height={size} loop autoplay />
)

export const ConfettiAnimation = ({ onComplete }) => (
  <LottieAnimation
    src={ANIM.confetti}
    width={400}
    height={400}
    loop={false}
    autoplay
    onComplete={onComplete}
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 9999,
    }}
  />
)

export const TrophyAnimation = ({ size = 120 }) => (
  <LottieAnimation src={ANIM.trophy} width={size} height={size} loop={false} autoplay />
)

export const SuccessCheckAnimation = ({ size = 100 }) => (
  <LottieAnimation src={ANIM.check} width={size} height={size} loop={false} autoplay />
)

export const FireStreakAnimation = ({ size = 48 }) => (
  <LottieAnimation src={ANIM.fire} width={size} height={size} loop autoplay />
)

export const EmptyStudyAnimation = ({ size = 200 }) => (
  <LottieAnimation src={ANIM.study} width={size} height={size} loop autoplay />
)

export const UploadAnimation = ({ size = 120 }) => (
  <LottieAnimation src={ANIM.upload} width={size} height={size} loop autoplay />
)

export const MicAnimation = ({ size = 80 }) => (
  <LottieAnimation src={ANIM.mic} width={size} height={size} loop autoplay />
)

// ── Sector-specific animated icons ────────────────────────────────────────────
const SECTOR_CONFIG = {
  it_tech:     { Icon: Desktop,       color: '#2563EB' },
  government:  { Icon: Buildings,     color: '#7C3AED' },
  banking:     { Icon: Bank,          color: '#F59E0B' },
  engineering: { Icon: Wrench,        color: '#059669' },
  medical:     { Icon: Heartbeat,     color: '#DC2626' },
  students:    { Icon: GraduationCap, color: '#EA580C' },
  business:    { Icon: Briefcase,     color: '#DB2777' },
}

export const SectorIcon = ({ sector, size = 32, weight = 'duotone', style: extraStyle = {} }) => {
  const { Icon, color } = SECTOR_CONFIG[sector] || SECTOR_CONFIG.it_tech
  return (
    <Icon size={size} color={color} weight={weight} style={{ flexShrink: 0, ...extraStyle }} />
  )
}
