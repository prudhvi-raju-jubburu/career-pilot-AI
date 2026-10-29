import os
import smtplib
import html
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List, Optional, Tuple

from app.models.digest_delivery import DigestDeliveryModel

logger = logging.getLogger(__name__)

class EmailService:
    """
    Production-grade email service for CareerPilot AI.
    Handles HTML + plaintext multipart digest rendering, link safety,
    SMTP delivery with TLS, error classification, and simulated fallbacks.
    """

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        return {
            "server": os.getenv("MAIL_SERVER", "").strip(),
            "port": int(os.getenv("MAIL_PORT", 587)),
            "use_tls": os.getenv("MAIL_USE_TLS", "true").lower() in ("true", "1", "yes"),
            "username": os.getenv("MAIL_USERNAME", "").strip(),
            "password": os.getenv("MAIL_PASSWORD", "").strip(),
            "sender": os.getenv("MAIL_DEFAULT_SENDER", "CareerPilot AI <alerts@careerpilot.ai>").strip()
        }

    @classmethod
    def is_configured(cls) -> bool:
        cfg = cls.get_smtp_config()
        return bool(cfg["server"] and cfg["username"] and cfg["password"])

    @classmethod
    def render_digest_content(
        cls,
        user_name: str,
        opportunities: List[Dict[str, Any]],
        frequency: str = "daily",
        frontend_url: str = "http://localhost:5173"
    ) -> Tuple[str, str]:
        """
        Renders safe, accessible plain-text and HTML versions of the career digest.
        All opportunity and user inputs are strictly escaped to prevent injection.
        """
        clean_name = html.escape(user_name or "Student")
        freq_title = "Daily Career Radar" if frequency == "daily" else "Weekly Opportunity Digest"
        web_url = frontend_url.rstrip("/")

        # Plain-Text Version
        lines = [
            f"CareerPilot AI — {freq_title}",
            f"Hello {clean_name},",
            "",
            f"Here are your top personalized opportunity matches selected by CareerPilot AI:",
            "------------------------------------------------------------------"
        ]

        for i, opp in enumerate(opportunities, 1):
            title = opp.get("title", "Role")
            comp = (opp.get("organization") or {}).get("name") or opp.get("company", "Organization")
            opp_type = opp.get("type", "Opportunity").title()
            score = opp.get("match_score", 85)
            deadline = opp.get("dates", {}).get("deadline") or opp.get("deadline") or "Not specified"
            opp_id = opp.get("id") or opp.get("_id")
            link = f"{web_url}/opportunities?selected={opp_id}"

            lines.append(f"{i}. {title} at {comp} [{opp_type}]")
            lines.append(f"   Match Fit: {score}%")
            lines.append(f"   Deadline: {deadline}")
            lines.append(f"   Link: {link}")
            lines.append("")

        lines.extend([
            "------------------------------------------------------------------",
            f"Manage your notification preferences anytime at: {web_url}/settings",
            "CareerPilot AI — Autonomous Career Discovery Platform"
        ])
        plain_text = "\n".join(lines)

        # HTML Version (Responsive, styled with CareerPilot blue & navy)
        opp_html_cards = []
        for opp in opportunities:
            h_title = html.escape(str(opp.get("title", "Opportunity")))
            h_comp = html.escape(str((opp.get("organization") or {}).get("name") or opp.get("company", "Organization")))
            h_type = html.escape(str(opp.get("type", "Job")).upper())
            score = int(opp.get("match_score", 85))
            deadline = html.escape(str(opp.get("dates", {}).get("deadline") or opp.get("deadline") or "Not specified"))
            opp_id = html.escape(str(opp.get("id") or opp.get("_id") or ""))
            h_link = f"{web_url}/opportunities?selected={opp_id}"

            why_list = opp.get("why_matched") or []
            h_why = html.escape(str(why_list[0])) if why_list else "Matches your verified skills and graduation batch."

            opp_html_cards.append(f"""
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <span style="font-size: 11px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;">{h_type}</span>
                  <h3 style="margin: 8px 0 4px 0; font-size: 16px; color: #0f172a;">{h_title}</h3>
                  <div style="font-size: 13px; font-weight: 600; color: #475569;">{h_comp}</div>
                </div>
                <div style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 999px;">
                  {score}% Fit
                </div>
              </div>
              <p style="font-size: 13px; color: #64748b; margin: 10px 0 12px 0; line-height: 1.4;">
                {h_why}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                <span>Deadline: <strong style="color: #475569;">{deadline}</strong></span>
                <a href="{h_link}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block;">
                  View & Apply &rarr;
                </a>
              </div>
            </div>
            """)

        cards_combined = "\n".join(opp_html_cards)

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{freq_title}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 6px 0; font-weight: 800;">CareerPilot AI</h1>
              <div style="color: #94a3b8; font-size: 14px; font-weight: 500;">{freq_title} &bull; Tailored for {clean_name}</div>
            </div>
            
            <div style="padding: 24px; background-color: #f8fafc;">
              <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.5;">
                Hello <strong>{clean_name}</strong>, our AI radar analyzed verified openings matching your profile, skills, and target roles:
              </p>
              
              {cards_combined}
              
              <div style="text-align: center; margin-top: 24px;">
                <a href="{web_url}/opportunities" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Open All Matching Opportunities
                </a>
              </div>
            </div>
            
            <div style="padding: 18px 24px; background-color: #ffffff; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">You received this because email digests are enabled on your account.</p>
              <a href="{web_url}/settings" style="color: #2563eb; text-decoration: none; font-weight: 600;">Manage Notification Preferences</a>
            </div>
          </div>
        </body>
        </html>
        """
        return plain_text, html_body

    @classmethod
    def build_digest_email(
        cls,
        user_name: str,
        opportunities: List[Dict[str, Any]],
        digest_date: Optional[str] = None,
        frequency: str = "daily",
        frontend_url: str = "http://localhost:5173"
    ) -> Tuple[str, str]:
        return cls.render_digest_content(
            user_name=user_name,
            opportunities=opportunities,
            frequency=frequency,
            frontend_url=frontend_url
        )

    @classmethod
    def send_digest_email(
        cls,
        user_id: str,
        user_name: str,
        recipient_email: str,
        opportunities: List[Dict[str, Any]],
        digest_date: str,
        frequency: str = "daily"
    ) -> Dict[str, Any]:
        """
        Builds, logs, and dispatches the email digest with delivery tracking and idempotency.
        If SMTP is unconfigured, enters safe simulated delivery mode.
        """
        if not opportunities:
            return {"status": "skipped", "message": "No opportunities to send"}

        # Idempotency check: Don't send twice for same window
        if DigestDeliveryModel.has_delivered_today(user_id, digest_date, frequency):
            return {"status": "skipped", "message": "Already delivered for this window"}

        opp_ids = [str(o.get("id") or o.get("_id")) for o in opportunities if (o.get("id") or o.get("_id"))]
        plain_text, html_body = cls.render_digest_content(user_name, opportunities, frequency)

        cfg = cls.get_smtp_config()
        if not cls.is_configured():
            logger.info("SMTP credentials not configured. Recording simulated digest delivery for user %s (%s).", user_id, recipient_email)
            DigestDeliveryModel.record_delivery(
                user_id=user_id,
                recipient_email=recipient_email,
                digest_date=digest_date,
                frequency=frequency,
                opportunity_ids=opp_ids,
                status="simulated",
                error="SMTP_NOT_CONFIGURED (safe simulation mode)"
            )
            return {
                "status": "simulated",
                "message": "SMTP not configured; simulated email recorded idempotently",
                "recipient": recipient_email,
                "opportunities_count": len(opportunities)
            }

        # Dispatch via live SMTP
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"CareerPilot AI: Your {frequency.title()} Opportunity Digest ({len(opportunities)} Matches)"
            msg["From"] = cfg["sender"]
            msg["To"] = recipient_email

            part1 = MIMEText(plain_text, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(cfg["server"], cfg["port"], timeout=15) as server:
                if cfg["use_tls"]:
                    server.starttls()
                server.login(cfg["username"], cfg["password"])
                server.sendmail(cfg["sender"], [recipient_email], msg.as_string())

            logger.info("Successfully dispatched %s digest to %s", frequency, recipient_email)
            DigestDeliveryModel.record_delivery(
                user_id=user_id,
                recipient_email=recipient_email,
                digest_date=digest_date,
                frequency=frequency,
                opportunity_ids=opp_ids,
                status="sent"
            )
            return {"status": "sent", "recipient": recipient_email, "count": len(opportunities)}

        except Exception as e:
            logger.exception("Failed to send digest email to %s: %s", recipient_email, str(e))
            DigestDeliveryModel.record_delivery(
                user_id=user_id,
                recipient_email=recipient_email,
                digest_date=digest_date,
                frequency=frequency,
                opportunity_ids=opp_ids,
                status="failed",
                error=str(e)
            )
            return {"status": "failed", "error": str(e)}
