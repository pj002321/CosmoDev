export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
export const LOCALE_COOKIE = "locale";

const dict = {
  ko: {
    nav: {
      home: "홈",
      write: "글쓰기",
      myPosts: "내 글",
      explore: "피드",
      friends: "내 친구",
      settings: "설정",
      graph: "그래프",
      logout: "로그아웃",
      tagline: "개인 개발 일지",
      login: "로그인",
      signup: "회원가입",
    },
    contact: "문의하기",
    explore: {
      eyebrow: "FEED",
      title: "친구와 이웃의 피드",
      empty: "아직 다른 사람이 쓴 글이 없습니다.",
    },
    friends: {
      eyebrow: "FRIENDS",
      title: "내 친구",
      empty: "아직 팔로우한 친구가 없습니다. 피드에서 팔로우해보세요.",
    },
    sidebar: {
      settings: "설정",
      friends: "내 친구",
      account: "계정 설정",
      settingsTitle: "일반 설정",
      language: "언어",
    },
    home: {
      whoami: "whoami",
      heroTitle: "오늘 생각을 정리해보세요",
      heroDesc: "친구나 이웃의 글은 그 사람의 프로필 링크로 볼 수 있어요.",
      archive: "MY ARCHIVE",
      newPost: "+ 새 글",
      empty: "아직 작성된 글이 없습니다.",
      defaultTagline: "내가 쓴 글",
      all: "전체",
    },
    footer: "built with next.js · deployed on vercel",
  },
  en: {
    nav: {
      home: "Home",
      write: "Write",
      myPosts: "My Posts",
      explore: "Feed",
      friends: "Friends",
      settings: "Settings",
      graph: "Graph",
      logout: "Log out",
      tagline: "Personal dev journal",
      login: "Log in",
      signup: "Sign up",
    },
    contact: "Contact",
    explore: {
      eyebrow: "FEED",
      title: "See what friends and neighbors are writing",
      empty: "No posts from others yet.",
    },
    friends: {
      eyebrow: "FRIENDS",
      title: "My Friends",
      empty: "Not following anyone yet. Follow people from the feed.",
    },
    sidebar: {
      settings: "Settings",
      friends: "Friends",
      account: "Account",
      settingsTitle: "General Settings",
      language: "Language",
    },
    home: {
      whoami: "whoami",
      heroTitle: "Organize your thoughts today",
      heroDesc: "You can read a friend's or neighbor's posts via their profile link.",
      archive: "MY ARCHIVE",
      newPost: "+ New post",
      empty: "No posts yet.",
      defaultTagline: "Posts I've written",
      all: "All",
    },
    footer: "built with next.js · deployed on vercel",
  },
} as const;

export function getDict(locale: Locale) {
  return dict[locale];
}
