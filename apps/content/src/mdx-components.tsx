import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';

import { APIPage } from '@/lib/api-page';
import Video from '@/components/Video';

import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

function StubComponent() {
  return null;
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
  IntroFeature: StubComponent,
  SupportedLocales: StubComponent,
  Tweet,
  Video,
} satisfies MDXComponents;

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
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
