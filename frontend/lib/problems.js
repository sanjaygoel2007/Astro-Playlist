// Problems data structure with all 50 problems categorized
export const PROBLEMS = {
  "Marriage & Relationship Problems": [
    { id: 1, name: "Delay in marriage" },
    { id: 2, name: "Marriage not getting fixed despite efforts" },
    { id: 3, name: "Love marriage vs arranged marriage confusion" },
    { id: 4, name: "Inter-caste / inter-religion marriage issues" },
    { id: 5, name: "Relationship breakups" },
    { id: 6, name: "Divorce or separation problems" },
    { id: 7, name: "Frequent fights between husband and wife" },
    { id: 8, name: "Lack of emotional bonding" },
    { id: 9, name: "Extra-marital affair suspicion" },
    { id: 10, name: "Compatibility (Kundli matching) issues" }
  ],
  "Career & Job Problems": [
    { id: 11, name: "Job not getting despite qualifications" },
    { id: 12, name: "Frequent job changes" },
    { id: 13, name: "Job instability or termination fear" },
    { id: 14, name: "Career growth blocked" },
    { id: 15, name: "Workplace politics" },
    { id: 16, name: "Problems with seniors or boss" },
    { id: 17, name: "Transfer issues" },
    { id: 18, name: "Government job delay" },
    { id: 19, name: "Exam failures" },
    { id: 20, name: "Career direction confusion" }
  ],
  "Business & Financial Problems": [
    { id: 21, name: "Business losses" },
    { id: 22, name: "Sudden financial downfall" },
    { id: 23, name: "Debt and loan pressure" },
    { id: 24, name: "Cash flow problems" },
    { id: 25, name: "Partnership disputes" },
    { id: 26, name: "Business not growing" },
    { id: 27, name: "Investment losses" },
    { id: 28, name: "Property disputes" },
    { id: 29, name: "Legal cases related to money" },
    { id: 30, name: "Sudden expenses" }
  ],
  "Health Problems": [
    { id: 31, name: "Chronic illness without clear diagnosis" },
    { id: 32, name: "Mental stress, anxiety, depression" },
    { id: 33, name: "Sleep disorders" },
    { id: 34, name: "Reproductive health issues" },
    { id: 35, name: "Child health problems" },
    { id: 36, name: "Frequent accidents" },
    { id: 37, name: "Surgery fear" },
    { id: 38, name: "Long-term medication issues" }
  ],
  "Children & Family Problems": [
    { id: 39, name: "Delay in childbirth" },
    { id: 40, name: "Infertility issues" },
    { id: 41, name: "Child education problems" },
    { id: 42, name: "Children going on wrong path" },
    { id: 43, name: "Disobedient children" },
    { id: 44, name: "Family conflicts" },
    { id: 45, name: "In-law related problems" }
  ],
  "Spiritual, Negative Energy & Destiny Issues": [
    { id: 46, name: "Bad luck / everything going wrong" },
    { id: 47, name: "Fear of black magic / negative energy" },
    { id: 48, name: "Repeated failures despite hard work" },
    { id: 49, name: "Sudden losses or unexpected events" },
    { id: 50, name: "Desire to know future / life purpose" }
  ]
};

// Get all problems as a flat array
export const getAllProblems = () => {
  return Object.values(PROBLEMS).flat();
};

// Get problem by ID
export const getProblemById = (id) => {
  return getAllProblems().find(p => p.id === id);
};

// Translations (placeholder - can be expanded)
export const translations = {
  en: {
    selectLanguage: "Select Your Preferred Language",
    mobileNumber: "Mobile Number",
    authenticate: "Authenticate Mobile via OTP",
    sendOTP: "Send OTP",
    verifyOTP: "Verify OTP",
    enterOTP: "Enter OTP",
    name: "Name",
    dateOfBirth: "Date of Birth",
    timeOfBirth: "Time of Birth (Optional)",
    placeOfBirth: "Place of Birth",
    typeOfProblem: "Type of Problem",
    selectProblems: "Select one or more problems",
    submit: "Submit",
    mahadasha: "Mahadasha",
    antardasha: "Antardasha",
    endDate: "End Date of Antardasha",
    playlistLink: "Your Playlist Link",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  },
  hi: {
    selectLanguage: "अपनी पसंदीदा भाषा चुनें",
    mobileNumber: "मोबाइल नंबर",
    authenticate: "OTP के माध्यम से मोबाइल प्रमाणित करें",
    sendOTP: "OTP भेजें",
    verifyOTP: "OTP सत्यापित करें",
    enterOTP: "OTP दर्ज करें",
    name: "नाम",
    dateOfBirth: "जन्म तिथि",
    timeOfBirth: "जन्म समय (वैकल्पिक)",
    placeOfBirth: "जन्म स्थान",
    typeOfProblem: "समस्या का प्रकार",
    selectProblems: "एक या अधिक समस्याएं चुनें",
    submit: "जमा करें",
    mahadasha: "महादशा",
    antardasha: "अंतर्दशा",
    endDate: "अंतर्दशा की समाप्ति तिथि",
    playlistLink: "आपका प्लेलिस्ट लिंक",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफल"
  }
};

