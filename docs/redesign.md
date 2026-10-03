# MakerSpace redesign

The approved local design is connected to the existing authenticated APIs. No schema, migrations or production database changes are introduced by this redesign.

- Shared light palette from the supplied logo: violet, turquoise, pink and orange.
- Dashboard navigation, personal hour summaries and persistent timer on every dashboard tab.
- Overview includes total funding (paid and submitted remain distinct), hours funding value, equipment budget, remaining money after purchases, open tasks, calendar, news, polls and FAQs.
- Existing detail, edit, print, administration and voting flows remain available.
- Local sample preview is excluded from Git/deployment. Live logo is in `public/brand`.

Validation: production build and TypeScript passed; 16 security/password tests passed. Browser checks used an isolated temporary SQLite database and test account for login, starting a timer, changing tabs, reloading, stopping and checking the saved entry. The existing rounding to full hours is retained. Funding and equipment values were checked against fixture values. Full component lint retains pre-existing `any` and hook findings; dashboard/login lint passes.

Deployment uses the existing Railway service `Stundentool`, GitHub repository `NBS-MSLK/Stundentool`, branch `main`, existing `/app/data` volume and `npm start`.
