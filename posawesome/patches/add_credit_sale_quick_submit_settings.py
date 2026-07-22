import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field


FIELDS = [
    {
        "fieldname": "posa_credit_sale_quick_submit",
        "label": "Enable Quick Credit Sale",
        "fieldtype": "Check",
        "default": "0",
        "depends_on": "posa_allow_credit_sale",
        "description": (
            "Show a one-click 'Invoice & Print (Pay Later)' action in the POS that submits and prints the "
            "invoice unpaid. The balance is collected later with a normal Payment Entry."
        ),
        "insert_after": "posa_allow_credit_sale",
    },
    {
        "fieldname": "posa_default_credit_sale_days",
        "label": "Default Credit Sale Due Days",
        "fieldtype": "Int",
        "default": "30",
        "non_negative": 1,
        "depends_on": "posa_credit_sale_quick_submit",
        "description": "Days added to today to set the due date on quick credit sales.",
        "insert_after": "posa_credit_sale_quick_submit",
    },
]


def execute():
    for field in FIELDS:
        custom_field_name = f"POS Profile-{field['fieldname']}"
        if not frappe.db.exists("Custom Field", custom_field_name):
            create_custom_field("POS Profile", field)
            continue

        updates = {key: value for key, value in field.items() if key != "insert_after"}
        frappe.db.set_value(
            "Custom Field",
            custom_field_name,
            updates,
            update_modified=False,
        )
        frappe.db.set_value(
            "Custom Field",
            custom_field_name,
            "insert_after",
            field["insert_after"],
            update_modified=False,
        )
