import { AbodePage } from './app.po';

describe('abode App', () => {
  let page: AbodePage;

  beforeEach(() => {
    page = new AbodePage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
