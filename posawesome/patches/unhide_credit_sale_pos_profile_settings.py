import frappe


# "Allow Credit Sale" used to be nested under "Allow Partial Payment", which hid it
# entirely until partial payment was enabled. The two settings are independent -
# every partial-payment check in the payment validator is skipped for credit sales -
# so the dependency only made the setting hard to find.
UPDATES = {
    "POS Profile-posa_allow_credit_sale": {
        "depends_on": "",
    },
    "POS Profile-posa_credit_sale_quick_submit": {
        "label": "Quick Credit Sale",
        "description": (
            "Turns PAY into a one-click 'Submit & Print' that posts the invoice unpaid and "
            "prints it, with no payment screen. A separate 'Collect Payment' button stays "
            "available for customers paying immediately. Balances are settled later with a "
            "normal Payment Entry."
        ),
    },
}


def execute():
    for custom_field_name, updates in UPDATES.items():
        if not frappe.db.exists("Custom Field", custom_field_name):
            continue

        frappe.db.set_value(
            "Custom Field",
            custom_field_name,
            updates,
            update_modified=False,
        )

    frappe.clear_cache(doctype="POS Profile")
