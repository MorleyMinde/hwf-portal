import { Waterpoint3Page } from './app.po';

describe('waterpoint3 App', () => {
  let page: Waterpoint3Page;

  beforeEach(() => {
    page = new Waterpoint3Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
