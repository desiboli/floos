import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_legal/terms")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <article className="space-y-8 text-sm leading-relaxed">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: April 18, 2026</p>
      </div>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your relationship with Floos (the
        &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these
        Terms. If you disagree with any part of the Terms, you may not access the Service.
      </p>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">1. Subscriptions</h2>
        <p>
          Some parts of the Service may be billed on a subscription basis
          (&quot;Subscription(s)&quot;). You will be billed in advance on a recurring and periodic
          basis (&quot;Billing Cycle&quot;). Billing cycles are typically set on a monthly basis
          unless otherwise communicated.
        </p>
        <p>
          At the end of each Billing Cycle, your Subscription will automatically renew under the
          same conditions unless you cancel it or we cancel it. You may cancel your Subscription
          through your account settings or by contacting support.
        </p>
        <p>
          A valid payment method may be required where applicable. You must provide accurate and
          complete billing information. By submitting payment information, you authorize us to
          charge Subscription fees to your chosen payment method.
        </p>
        <p>
          If automatic billing fails, we may issue an invoice and require manual payment within a
          stated deadline.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">2. Fee changes</h2>
        <p>
          We may modify Subscription fees at our sole discretion. Any changes will take effect at
          the end of the current Billing Cycle unless otherwise stated.
        </p>
        <p>
          We will provide reasonable prior notice of any changes. Continued use of the Service after
          fee changes take effect constitutes your agreement to the new fees.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">3. Refunds</h2>
        <p>
          Refund requests may be considered on a case-by-case basis and are granted at our sole
          discretion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">4. Content</h2>
        <p>
          Our Service may allow you to post, link, store, share, and otherwise make available
          various information (&quot;Content&quot;). You are responsible for the legality,
          reliability, and appropriateness of any Content you provide.
        </p>
        <p>
          By posting Content, you grant us a license to use, modify, display, reproduce, and
          distribute it on the Service as needed to operate and improve the Service. You retain
          ownership of your Content and are responsible for protecting your rights.
        </p>
        <p>You warrant that:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>You own or have rights to the Content, and</li>
          <li>Posting the Content does not violate any rights of others.</li>
        </ul>
        <p>
          We do not verify the accuracy or suitability of any financial or tax-related Content
          shared through the Service. Use of such Content is at your own risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">5. Accounts</h2>
        <p>
          When you create an account, you must provide accurate, complete, and current information.
          Failure to do so constitutes a breach of these Terms.
        </p>
        <p>
          You are responsible for safeguarding your password and all activity under your account.
          You agree not to disclose your password to any third party and to notify us of any
          unauthorized use.
        </p>
        <p>You may not use a username that:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Belongs to someone else without authorization,</li>
          <li>Is not lawfully available, or</li>
          <li>Is offensive, vulgar, or obscene.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">6. Financial and tax disclaimer</h2>
        <p>
          Floos is not a financial advisor, accountant, or tax consultant. All content and
          functionality within the Service are provided for general informational purposes only and
          do not constitute financial, legal, or tax advice.
        </p>
        <p>
          You are solely responsible for complying with all applicable financial and tax
          regulations, including local reporting obligations. We strongly recommend verifying all
          decisions and data with your local tax authority or a qualified professional.
        </p>
        <p>
          Floos accepts no liability for any consequences, losses, or penalties resulting from your
          use of the Service for financial or tax purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">
          7. Reliance on external services and user-generated data
        </h2>
        <p>
          Floos may rely on third-party services (for example, banking APIs, payment providers, and
          financial aggregators) to provide transactional data and related functionality. The
          Service may also involve manually entered or user-generated data.
        </p>
        <p>You acknowledge and agree that:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Financial and transactional data—whether sourced externally or entered by users—is
            displayed &quot;as is&quot;, without verification or warranty;
          </li>
          <li>
            We cannot guarantee the completeness, accuracy, timeliness, or reliability of such data;
          </li>
          <li>
            You are solely responsible for verifying all information before using it for decisions
            or reporting;
          </li>
          <li>
            We shall not be liable for any loss, damage, or liability arising from the use of such
            data, including errors, omissions, delays, misinterpretations, or disruptions;
          </li>
          <li>
            Your reliance on third-party data or user-submitted content is entirely at your own
            risk.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">8. Copyright policy</h2>
        <p>
          We respect intellectual property rights and respond to claims of copyright or other IP
          infringement.
        </p>
        <p>
          If you believe your work has been used in a way that constitutes infringement, please
          contact us at{" "}
          <a
            className="font-medium text-primary underline underline-offset-4"
            href="mailto:legal@floos.app"
          >
            legal@floos.app
          </a>{" "}
          with a detailed description of the material, identification of the copyrighted work, your
          contact details, and a good-faith statement of unauthorized use. False claims may result
          in legal liability, including damages and attorney&apos;s fees.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">9. Intellectual property</h2>
        <p>
          The Service and its original content (excluding Content provided by users), features, and
          functionality are and remain the property of Floos and its licensors.
        </p>
        <p>Our trademarks and trade dress may not be used without prior written permission.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">10. Links to other websites</h2>
        <p>
          The Service may contain links to third-party websites or services that are not controlled
          by us.
        </p>
        <p>
          We assume no responsibility for third-party content, privacy policies, or practices. You
          agree that we shall not be liable for any loss or damage caused by use of such content or
          services.
        </p>
        <p>Please review the terms and policies of any third-party websites you visit.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">11. Termination</h2>
        <p>
          We may terminate or suspend your account without prior notice for any reason, including
          violation of these Terms.
        </p>
        <p>
          Upon termination, your right to use the Service will cease immediately. You may also
          terminate your account at any time by discontinuing use of the Service or by following
          account closure steps we provide.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">12. Limitation of liability</h2>
        <p>
          Floos and its affiliates, directors, employees, and suppliers shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, including:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Loss of profits, data, or goodwill,</li>
          <li>Errors or delays in third-party data,</li>
          <li>Unauthorized access or use of your Content, or</li>
          <li>Any use of the Service.</li>
        </ul>
        <p>This limitation applies even if a remedy fails of its essential purpose.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">13. Disclaimer</h2>
        <p>
          You use the Service at your own risk. The Service is provided on an &quot;AS IS&quot; and
          &quot;AS AVAILABLE&quot; basis, without warranties of any kind.
        </p>
        <p>We do not warrant that:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>The Service will be secure, timely, or error-free,</li>
          <li>Any defects will be corrected,</li>
          <li>The Service is free of viruses or harmful components,</li>
          <li>The results will meet your requirements, or</li>
          <li>Third-party data or integrations will be reliable.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">14. Governing law</h2>
        <p>
          These Terms are governed by the laws of Sweden, without regard to its conflict of law
          rules.
        </p>
        <p>
          Failure to enforce any part of the Terms does not waive our rights. If any provision is
          found to be invalid, the remainder remains in effect.
        </p>
        <p>
          These Terms constitute the entire agreement between you and Floos regarding the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">15. Changes</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. Material changes will
          be announced at least 30 days before they take effect where required by law.
        </p>
        <p>
          By continuing to use the Service after changes are effective, you agree to be bound by the
          new terms. If you do not agree, please stop using the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">16. Contact us</h2>
        <p>
          For questions regarding these Terms, contact us at{" "}
          <a
            className="font-medium text-primary underline underline-offset-4"
            href="mailto:legal@floos.app"
          >
            legal@floos.app
          </a>
          .
        </p>
      </section>
    </article>
  );
}
