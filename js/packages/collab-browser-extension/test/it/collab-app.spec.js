describe('collab app', () => {
  describe.skip('Chrome only', () => {
    it('prompts user to install extension when not installed')
    it('provides user with a notification when the extension has been installed')
    it('prompts user to launch extension to capture a screenshot')
    it('displays screenshot when received provided by the extension')
  })
  describe.skip('other browsers', () => {
    it('does not prompt the user to install or launch the extension')
  })
})
