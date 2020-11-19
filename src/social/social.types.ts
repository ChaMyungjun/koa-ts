export interface StrategyOptionsKakao {
  authorizationURL?: string;
  tokenURL?: string;
  clientSecret?: string;
  scopeSeparator?: string;
  customHeaders?: {
    "User-Agent"?: string;
  };
  userAgent?: string;
}

export interface ProfileKakao {
  provider: "kakao";
  id?: number | string;
  username?: string;
  displayName: string;
  _raw: string;
  _json: string;
}

export interface StrategyOptionsNaver {
  authorizationURL?: string;
  tokenURL?: string;
  clientSecret?: string;
  profileURL?: string;
  userAgent?: string;
  svcType?: string;
}

export interface ProfileNaver {
  provider: "naver";
  id?: number | string;
  displayname?: string;
  emails?: [{}];
  _json?: {
    email?: string;
    nickname?: string;
    profileImage?: string;
    age?: number | string;
    birthday?: number | string;
    id?: number | string;
  };
  _raw?: string;
}
