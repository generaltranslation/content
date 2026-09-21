import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Card, Cards as FumadocsCards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as icons from 'lucide-react';

import { APIPage } from '@/lib/api-page';
import Video from '@/components/Video';

import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

function StubComponent() {
  return null;
}

// The production blog renders <Carousel> as a scroll-snap gallery; the
// preview only needs the images to show, so they stack in reading order.
function Carousel({
  label,
  children,
}: {
  label?: string;
  width?: number | string;
  height?: number | string;
  interval?: number | string;
  children?: React.ReactNode;
}) {
  return (
    <figure aria-label={label} style={{ display: 'grid', gap: 12, margin: '2rem 0' }}>
      {children}
    </figure>
  );
}

function HitList({ label, children }: { label?: string; children?: React.ReactNode }) {
  return (
    <ul aria-label={label} style={{ display: 'grid', gap: '10px 40px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', listStyle: 'none', padding: 0, margin: '1.5rem 0' }}>
      {children}
    </ul>
  );
}

function HitItem({ children }: { children?: React.ReactNode }) {
  return <li>✕ {children}</li>;
}

function CarouselItem({ src, alt }: { src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static blog asset
    <img src={src} alt={alt ?? ''} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
  );
}

function IntroFeature({
  children,
  title,
}: {
  children: React.ReactNode;
  icon: 'libraries' | 'platform' | 'locadex';
  title: string;
}) {
  return (
    <div className='my-4 rounded-lg border p-4'>
      <strong>{title}</strong>
      <p className='mb-0 mt-2 text-sm text-fd-muted-foreground'>{children}</p>
    </div>
  );
}

function Cards({
  hideArrows: _hideArrows,
  ...props
}: React.ComponentProps<typeof FumadocsCards> & { hideArrows?: boolean }) {
  // The shared MDX also targets the production renderer's arrow-bearing cards.
  // Fumadocs' cards have no arrows; consume the prop without hiding their icons.
  return <FumadocsCards {...props} />;
}

function GitHub() {
  return (
    <p>
      <a href='https://github.com/generaltranslation/gt'>
        View generaltranslation/gt on GitHub
      </a>
    </p>
  );
}

type TweetProps =
  | {
      id: string;
      header?: never;
      subheader?: never;
    }
  | {
      id?: never;
      header: string;
      subheader: string;
    };

function Tweet(props: TweetProps) {
  if (props.id === undefined) {
    return (
      <p>
        <a href='https://x.com/generaltxn'>
          <strong>{props.header}</strong>
          <br />
          {props.subheader}
        </a>
      </p>
    );
  }

  return (
    <p>
      <a href={`https://x.com/generaltxn/status/${props.id}`}>
        View post on X
      </a>
    </p>
  );
}

function MdxImage({ style, ...props }: ComponentPropsWithoutRef<'img'>) {
  return (
    <img {...props} style={{ maxWidth: '100%', height: 'auto', ...style }} />
  );
}

function TOC({
  items,
}: {
  items?: React.ComponentProps<typeof InlineTOC>['items'];
}) {
  return items ? <InlineTOC items={items} /> : null;
}

const customComponents = {
  AllLogoCards: StubComponent,
  AuthorSpotlight: StubComponent,
  Carousel,
  CarouselItem,
  HitList,
  HitItem,
  LogoCard: StubComponent,
  LogoCardContainer: StubComponent,
  LogoCardContent: StubComponent,
  LogoCardImage: StubComponent,
  Mermaid: StubComponent,
  ShadCard: StubComponent,
  CardContent: StubComponent,
  CardDescription: StubComponent,
  CardFooter: StubComponent,
  CardHeader: StubComponent,
  CardTitle: StubComponent,
  FumadocsArchitecture: StubComponent,
  GitHub,
  IntroFeature,
  SupportedLocales: StubComponent,
  Tweet,
  Video,
} satisfies MDXComponents;

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    // Matches the production renderer: every lucide icon is usable in MDX.
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    img: MdxImage,
    Accordion,
    Accordions,
    Card,
    Cards,
    File,
    Files,
    Folder,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    TOC,
    APIPage,
    ...customComponents,
    ...components,
  } satisfies MDXComponents;
}
