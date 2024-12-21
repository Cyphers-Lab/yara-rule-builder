export interface YaraString {
  id: string;
  identifier: string;
  value: string;
  type: 'text' | 'hex';
  modifiers: {
    nocase?: boolean;
    wide?: boolean;
    ascii?: boolean;
    fullword?: boolean;
  };
}

export interface YaraCondition {
  id: string;
  type: 'string' | 'filesize' | 'custom';
  operator?: 'and' | 'or' | 'not';
  value: string;
}

export interface YaraRule {
  name: string;
  tags: string[];
  meta: {
    author?: string;
    description?: string;
    date?: string;
    version?: string;
    [key: string]: string | undefined;
  };
  strings: YaraString[];
  conditions: YaraCondition[];
}
