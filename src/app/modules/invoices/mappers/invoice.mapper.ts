import moment from 'jalali-moment';

export type Pattern = 1 | 3;

export const s = (v: unknown) => (v ?? '').toString().trim();
export const n = (v: unknown) => (v === '' || v == null ? 0 : Number(v));

export function toTehranEndOfDayUnixMs(input: unknown): number {
  // ورودی می‌تونه Date یا string شمسی (jYYYY/jMM/jDD) یا timestamp باشه
  if (typeof input === 'number') return input;

  const m =
    input instanceof Date
      ? moment(input)
      : moment(s(input), ['jYYYY/jMM/jDD', moment.ISO_8601], true);

  // اگر invalid بود، همین الان بزن به امروز (بهتر از NaN)
  const mm = m.isValid() ? m : moment();

  mm.hour(23).minute(59).second(59).millisecond(0);
  return mm.valueOf(); // ms
}

/**
 * formValue: camelCase
 * خروجی: PascalCase برای بک‌اند
 * نکته: totals (t...) را اصلاً از فرانت نفرست (یا 0 بفرست) چون بک‌اند محاسبه می‌کند
 */
export function mapInvoiceCreatePayload(formValue: any, pattern: Pattern) {
  const header = formValue.header ?? formValue; // بسته به ساختار فرم شما

  return {
    Header: {
      Inp: pattern,
      // اگر اینا تو فرم هست:
      Inty: n(header.inty),
      Ins: n(header.ins),
      Setm: n(header.setm),
      Tob: n(header.tob),

      Bid: s(header.bid),
      Tinb: s(header.tinb),

      Inno: s(header.inno),
      Irtaxid: s(header.irtaxid),

      Indatim: toTehranEndOfDayUnixMs(header.indatim),
      Indati2m: toTehranEndOfDayUnixMs(header.indati2m),

      // totals را نده (یا صفر)
      Tprdis: 0,
      Tdis: 0,
      Tadis: 0,
      Tvam: 0,
      Todam: 0,
      Tbill: 0,
    },

    Body: (formValue.items ?? formValue.body ?? []).map((it: any) => {
      const base: any = {
        Sstid: s(it.sstid),
        Sstt: s(it.sstt),
        Am: n(it.am),      // وزن/تعداد
        Fee: n(it.fee),    // قیمت واحد
        Dis: n(it.dis),
        Vra: n(it.vra),    // نرخ مالیات
      };

      if (pattern === 3) {
        // طلا
        base.Consfee = n(it.consfee);
        base.Spro = n(it.spro);
        base.Bros = n(it.bros);
        // اگر Tcpbs دارید:
        base.Tcpbs = it.tcpbs == null || it.tcpbs === '' ? null : n(it.tcpbs);
      }

      return base;
    }),

    // Payments فعلاً اگر می‌خوای نفرست
    Payments: [],
  };
}
