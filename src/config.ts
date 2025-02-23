
export const elevenLabsVoices: Record<string, string> = {
  angry: 'KLZOWyG48RjZkAAjuM89', // Angry AL
  harry: 'SOYHLrjzK2X1ezoPC6cr', // Harry
  espero: 'eRS3faIyd3KSRjzmhPxE', // Llorando Espero
  tarun: 'v9Yyk1Gw8jEMGWtj1hgu', // Tarun D - Suspesne, Rich & Polished
  oxley: '2gPFXx8pN3Avh27Dw5Ma', // Oxley - Evil Character
  roger: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
}

export const actorMapsToVoices = {
  "nuclear-crisis": {
    'narrator': 'tarun',
    'Chief_of_Staff': 'angry',
    'National_Security_Advisor': 'harry',
    'Secretary_of_Defense':'roger',
    'Foreign_Minister':'oxley',
    'Press_Secretary':'espero'
  },
  "emergency-center": {
    'narrator': 'tarun',
    'distressed_caller': 'espero',
    'abuser': 'angry',
    'police': 'roger',
    'hospital': 'harry',
    'child': 'oxley'
  },
  "black-monday": {
    'narrator': 'tarun',
    'financial_analyst': 'angry',
    'pr_manager': 'espero',
    'media_analyst': 'harry',
    'stock_advisor': 'roger',
    'personal_advisor': 'oxley'
  }
}
