/** Hacker-theme Clerk styling — high contrast greens on near-black surfaces */
export const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorBackground: "#0a0a0a",
    colorForeground: "#00ff41",
    colorMutedForeground: "#7dff9a",
    colorNeutral: "#00cc33",
    colorPrimary: "#00ff41",
    colorPrimaryForeground: "#000000",
    colorInput: "#111111",
    colorInputForeground: "#f5f5f5",
    colorDanger: "#ff0040",
    colorWarning: "#ffb86c",
    borderRadius: "0.25rem",
    fontFamily: "var(--font-atkinson-mono), ui-monospace, monospace",
  },
  elements: {
    modalBackdrop: "bg-black/80 backdrop-blur-sm",
    modalContent: "font-mono",
    modalCloseButton: "text-primary hover:text-primary/80",
    card: "bg-black-light border border-primary/20 shadow-lg shadow-primary/10",
    headerTitle: "text-primary font-mono",
    headerSubtitle: "text-green-dark font-mono",
    dividerLine: "bg-primary/30",
    dividerText: "text-green-dark font-mono",
    socialButtonsBlockButton:
      "border border-primary/40 bg-black-lighter text-primary hover:bg-primary/10 hover:border-primary/60 font-mono",
    socialButtonsBlockButtonText: "text-primary font-mono",
    socialButtonsProviderIcon__github: "text-white brightness-0 invert",
    formFieldLabel: "text-green-dark font-mono",
    formFieldHintText: "text-green-dark font-mono",
    formFieldInput:
      "bg-black-light border border-primary/40 text-primary placeholder:text-green-darker focus:border-primary font-mono",
    formFieldInputShowPasswordButton: "text-green-dark hover:text-primary",
    formButtonPrimary:
      "bg-primary text-black hover:bg-primary/90 font-mono shadow-lg shadow-primary/20 [&_span]:text-black [&_svg]:text-black",
    formButtonReset: "text-green-dark hover:text-primary font-mono",
    footer: "bg-black-lighter border-t border-primary/20",
    footerItem: "text-green-dark font-mono",
    footerActionText: "text-green-dark font-mono",
    footerActionLink: "text-primary font-semibold hover:text-primary/80 font-mono",
    footerPages: "text-green-dark font-mono",
    footerPagesLink: "text-primary hover:text-primary/80 font-mono",
    identityPreviewText: "text-primary font-mono",
    identityPreviewEditButton: "text-green-dark hover:text-primary",
    alternativeMethodsBlockButton:
      "border border-primary/40 text-primary hover:bg-primary/10 font-mono",
    otpCodeFieldInput: "border-primary/40 text-primary bg-black-light font-mono",
    formResendCodeLink: "text-primary font-mono",
    badge: "bg-primary/10 border border-primary/30 text-green-dark font-mono",
    // User / org switcher popovers
    userButtonPopoverCard: "bg-black-light border border-primary/20",
    userButtonPopoverMain: "text-primary",
    userPreviewMainIdentifier: "text-primary",
    userPreviewSecondaryIdentifier: "text-green-dark",
    userButtonPopoverActionButton: "text-primary hover:bg-primary/10",
    userButtonPopoverActionButtonText: "text-primary",
    userButtonPopoverFooter: "text-green-dark",
    organizationSwitcherPopoverCard: "bg-black-light border border-primary/20",
    organizationSwitcherPopoverMain: "text-primary",
    organizationPreviewMainIdentifier: "text-primary",
    organizationPreviewSecondaryIdentifier: "text-green-dark",
    organizationSwitcherTriggerIcon: "text-primary",
    organizationSwitcherPopoverActionButton: "text-primary hover:bg-primary/10",
    organizationSwitcherPopoverActionButtonText: "text-primary",
    organizationListPreviewButton: "text-primary hover:bg-primary/10",
    organizationListPreviewTextContainer: "text-primary",
    organizationListCreateOrganizationActionButton:
      "text-primary border border-primary/40 hover:bg-primary/10",
    // Profile modals — dark sidebar so nav text stays readable
    navbar: "bg-black-light border-r border-primary/20 font-mono",
    navbarButtons: "gap-1",
    navbarButton:
      "text-green-dark hover:bg-primary/10 hover:text-primary font-mono data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
    navbarButtonText: "text-inherit font-mono",
    navbarButtonIcon: "text-inherit",
    navbarMobileMenuRow: "bg-black-light border-b border-primary/20",
    navbarMobileMenuButton: "text-primary hover:bg-primary/10",
    pageScrollBox: "bg-black-light",
    scrollBox: "bg-black-light",
    profileSection: "border-primary/20",
    profileSectionTitle: "text-primary font-mono",
    profileSectionTitleText: "text-primary font-mono",
    profileSectionContent: "text-green-dark font-mono",
    profileSectionPrimaryButton: "text-primary hover:text-primary/80 font-mono",
    accordionTriggerButton: "text-primary hover:bg-primary/10 font-mono",
    menuButton: "text-primary hover:bg-primary/10",
    menuList: "bg-black-light border border-primary/20",
    menuItem: "text-green-dark hover:bg-primary/10 hover:text-primary font-mono",
  },
};

/** Header org switcher — styled as a prominent dropdown trigger */
export const organizationSwitcherAppearance = {
  elements: {
    rootBox: "flex",
    organizationSwitcherTrigger:
      "org-switcher-trigger group font-mono text-sm font-medium text-primary min-h-9 px-3 py-1.5 rounded border-2 border-primary/50 bg-primary/10 shadow-md shadow-primary/15 hover:bg-primary/20 hover:border-primary transition-all duration-200",
    organizationSwitcherTriggerIcon:
      "text-primary ml-1.5 w-4 h-4 opacity-90 group-hover:opacity-100 transition-opacity",
    organizationPreviewTextContainer: "text-primary font-mono",
    organizationPreviewMainIdentifier:
      "text-primary font-mono truncate max-w-[148px]",
    organizationPreviewAvatarBox: "border border-primary/40",
  },
};
