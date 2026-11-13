import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ADLC Factory',
  tagline: 'Tài liệu hệ thống ADLC — điều phối · harness · sandbox · kiểm chứng',
  favicon: 'img/favicon.ico',

  // Docusaurus 3.10 (future.v4) không tự quét thư mục src/clientModules —
  // phải khai báo tường minh tại đây.
  clientModules: [
    './src/clientModules/d3TransitionPatch.ts',
    './src/clientModules/hideBenignResizeObserverOverlay.ts',
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://vanguard-lint.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/vanguard-factory/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'vanguard-lint', // Usually your GitHub org/user name.
  projectName: 'vanguard-factory', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ADLC Factory',
      logo: {
        alt: 'ADLC Factory logo',
        src: 'img/logo-vanguard.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tài liệu',
        },
        {
          href: 'https://github.com/vanguard-lint/vanguard-factory',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Tài liệu',
          items: [
            {label: 'Trang đích', to: '/docs/'},
            {label: 'Nền tảng ADLC', to: '/docs/fundamentals/bai-toan'},
            {label: 'Kiến trúc 4 tầng', to: '/docs/architecture/tong-quan-4-tang'},
            {label: 'Hướng dẫn chạy lần đầu', to: '/docs/user-guides/dung-he-thong-lan-dau'},
          ],
        },
        {
          title: 'Tra cứu',
          items: [
            {label: 'API REST', to: '/docs/reference/api-rest'},
            {label: 'MCP Tools', to: '/docs/reference/mcp-tools'},
            {label: 'Thuật ngữ', to: '/docs/reference/thuat-ngu'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ADLC Factory.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
