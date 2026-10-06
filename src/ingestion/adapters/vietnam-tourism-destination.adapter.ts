import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface ExternalDestinationItem {
  externalKey: string;
  sourceUrl: string;
  name: string;
  address: string | null;
  description: string | null;
  rawHtml: string;
}

@Injectable()
export class VietnamTourismDestinationAdapter {
  private readonly baseUrl =
    'https://csdl.vietnamtourism.gov.vn/dest';

  async fetchPage(
    page = 1,
  ): Promise<ExternalDestinationItem[]> {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        'Page must be a positive integer.',
      );
    }

    const url =
      page === 1
        ? this.baseUrl
        : `${this.baseUrl}/?page=${page}`;

    const response = await fetch(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml',
        'User-Agent':
          'SmartTravelSystem/1.0 (graduation-project)',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Vietnam Tourism source returned HTTP ${response.status}.`,
      );
    }

    const html = await response.text();

    return this.parseDestinationList(html);
  }

  private parseDestinationList(
    html: string,
  ): ExternalDestinationItem[] {
    const $ = cheerio.load(html);
    const items: ExternalDestinationItem[] = [];

    $('a[href*="?item="]').each(
      (_, element) => {
        const anchor = $(element);

        const href = anchor.attr('href');

        if (!href) {
          return;
        }

        const absoluteUrl = new URL(
          href,
          this.baseUrl,
        ).toString();

        const url = new URL(absoluteUrl);
        const externalKey =
          url.searchParams.get('item');

        if (!externalKey) {
          return;
        }

        const name = anchor
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        if (!name) {
          return;
        }

        const container =
          anchor.closest('div, article, li');

        const text = container
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        const addressMatch =
        text.match(
          /Địa chỉ:\s*(.*?)(?=\s*(Điện thoại(?:\s+di\s+động)?|Email|Website):|$)/i,
        );

        const address =
          addressMatch?.[1]?.trim() || null;

        items.push({
          externalKey,
          sourceUrl: absoluteUrl,
          name,
          address,
          description: null,
          rawHtml: $.html(container),
        });
      },
    );

    return this.deduplicate(items);
  }

  private deduplicate(
    items: ExternalDestinationItem[],
  ): ExternalDestinationItem[] {
    const seen = new Set<string>();
    const result: ExternalDestinationItem[] = [];

    for (const item of items) {
      if (seen.has(item.externalKey)) {
        continue;
      }

      seen.add(item.externalKey);
      result.push(item);
    }

    return result;
  }
}
