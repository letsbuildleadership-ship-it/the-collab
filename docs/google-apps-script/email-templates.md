# Pre-written email texts (paste each into its own Google Doc)

Each Google Doc holds only the body text. Use the `{{placeholders}}` exactly as written; the website fills them in.
Put the Doc's id (the long string in its address) in the Templates sheet next to the key.

## verify-email
Subject: `Confirm your email for The Co.LLab™`
Placeholders: `{{firstName}}` `{{url}}` `{{memberId}}` `{{contact}}`

```
Hello {{firstName}},

Please confirm your email to finish setting up your free Co.LLab™ account:
{{url}}

The link works once, for 24 hours. If you did not sign up, ignore this email.

The Co.LLab™
```

## password-reset
Subject: `Reset your Co.LLab™ password`
Placeholders: `{{url}}` `{{memberId}}` `{{contact}}`

```
Hello,

We received a request to reset the password for your Co.LLab™ account. Your Member ID is {{memberId}}.

Choose a new password here (the link works once, for 1 hour):
{{url}}

If you did not ask for this, ignore this email. Your password will not change.

The Co.LLab™
```

## purchase-confirmation
Subject: `Your Co.LLab™ purchase`
Placeholders: `{{firstName}}` `{{memberId}}` `{{products}}` `{{total}}` `{{accountUrl}}` `{{contact}}`

```
Thank you, {{firstName}}.

Your purchase is confirmed:
{{products}}

Total: {{total}}
Member ID: {{memberId}}

Open your account to download your products (this link signs you in; keep it private):
{{accountUrl}}

Your products are licensed for your internal use under The Co.LLab IP™ license. Questions: {{contact}}

The Co.LLab™
```

Note: the website's built-in purchase email also lists what each product includes and your sign-in steps.
If you want the Google Doc version to match it, add those lines to the Doc.
