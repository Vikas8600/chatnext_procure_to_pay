frappe.ui.form.on('Purchase Invoice', {
    refresh: function(frm) {
        if (frm.doc.segment) {
            frm.doc.items.forEach(function (item) {
                item.segment = frm.doc.segment;
            });
        }

        if (frm.doc.custom_parent_cost_center) {
            frm.doc.items.forEach(function (item) {
                item.custom_parent_cost_center = frm.doc.custom_parent_cost_center;
            });
        }

        frm.refresh_field('items');
        // Function to generate table rows for each item in the Purchase Invoice
        function generateItemRows(items) {
            let rows = '';
            if (items && items.length > 0) {
                items.forEach(function(item) {
                    rows += `
                    <tr>
                        <td>${item.item_code}</td>
                        <td>${item.expense_head || item.expense_account || 'N/A'}</td>
                        <td>${item.qty}</td>
                        <td>${item.rate}</td>
                        <td>${item.amount}</td>

                    </tr>
                    `;
                });
            } else {
                rows += `
                <tr>
                    <td colspan="5">No items available.</td>
                </tr>
                `;
            }
            return rows;
        }

        // Function to generate GST rows
        function generateGSTRows(taxes) {
            let rows = '';
            if (taxes && taxes.length > 0) {
                taxes.forEach(function(tax) {
                    rows += `
                    <tr>
                        <td>${tax.account_head}</td>
                        <td>${tax.rate || '0.00'}%</td>
                        <td>${tax.tax_amount || '0.00'}</td>
                        <td>${tax.description || 'N/A'}</td>
                    </tr>
                    `;
                });
            } else {
                rows += `
                <tr>
                    <td colspan="4">No GST details available.</td>
                </tr>
                `;
            }
            return rows;
        }

        // Function to generate the summary rows
        function generateSummaryRows(doc) {
            return `
            <tr>
                <td colspan="4" style="text-align:right;"><strong>Total Amount:</strong></td>
                <td>${doc.total || '0.00'}</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align:right;"><strong>Total Taxes and Charges:</strong></td>
                <td>${doc.total_taxes_and_charges || '0.00'}</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align:right;"><strong>Grand Total:</strong></td>
                <td>${doc.grand_total || '0.00'}</td>
            </tr>
            <tr>
                <td colspan="6" style="text-align:left;"><strong>Amount in Words:</strong> ${doc.in_words || 'Zero'}</td>
            </tr>
            `;
        }

        // Main HTML content for the custom Purchase Invoice section
        let table_html = `
        <style>
            .custom-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .custom-table th, .custom-table td {
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
            }
            .custom-table th {
                background-color: #f4f4f4;
                color: #333;
                font-weight: bold;
            }
            .custom-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .custom-table tr:hover {
                background-color: #e0e0e0;
            }
            .table-title {
                margin-top: 20px;
                font-size: 16px;
                font-weight: bold;
                text-align: left;
            }
            .custom-invoice-details {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.custom-invoice-detail {
    flex: 1;
    min-width: 200px;
    padding: 8px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

        </style>

<div class="custom-invoice-info">
    <h3>Invoice Summary</h3>
    <div class="custom-invoice-details">
        <div class="custom-invoice-detail">
            <p><strong>Invoice Number:</strong> ${frm.doc.name || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Date:</strong> ${frm.doc.posting_date || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Created By:</strong> ${frm.doc.owner || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Workflow State:</strong> ${frm.doc.workflow_state || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Supplier:</strong> ${frm.doc.supplier || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Tally Invoice No:</strong> ${frm.doc.tally_invoice_number_refrence || 'N/A'}</p>
        </div>

        <div class="custom-invoice-detail">
            <p><strong>Supplier Invoice No:</strong> ${frm.doc.bill_no || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Supplier Invoice Date:</strong> ${frm.doc.bill_date || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Segment:</strong> ${frm.doc.segment || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Cost Center:</strong> ${frm.doc.cost_center || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Billing Address:</strong> ${frm.doc.billing_address_display || 'N/A'}</p>
        </div>
        <div class="custom-invoice-detail">
            <p><strong>Shipping Address:</strong> ${frm.doc.shipping_address_display || 'N/A'}</p>
        </div>
    </div>
</div>


        <h3 class="table-title">Item Details</h3>
        <table class="custom-table">
            <thead>
                <tr>
                    <th>Item Code</th>
                    <th>Expense Head</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>

                </tr>
            </thead>
            <tbody>
                ${generateItemRows(frm.doc.items)}
                ${generateSummaryRows(frm.doc)}
            </tbody>
        </table>

        <h3 class="table-title">GST Details</h3>
        <p><strong>Taxes and Charges Template:</strong> ${frm.doc.taxes_and_charges || 'N/A'}</p>
        <table class="custom-table">
            <thead>
                <tr>
                    <th>Account Head</th>
                    <th>Rate (%)</th>
                    <th>Tax Amount</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${generateGSTRows(frm.doc.taxes)}
            </tbody>
        </table>
        `;

        // Insert the generated HTML into the custom field
        frm.fields_dict.custom_custom_table.$wrapper.html(table_html);
    },
    cost_center: function (frm) {
        let Segment = frm.doc.cost_center;

        frm.doc.items.forEach(function (item) {
            item.cost_center = Segment;
        });
    },

    segment: function (frm) {
        let customCostCentre = frm.doc.segment;

        frm.doc.items.forEach(function (item) {
            item.segment = customCostCentre;
        });
    },
    custom_parent_cost_center: function (frm) {
        let customCC = frm.doc.custom_parent_cost_center;

        frm.doc.items.forEach(function (item) {
            item.custom_parent_cost_centre = customCC;
        });
    },
    onload: function(frm) {
         // Set query for custom_cc field
         frm.set_query("custom_parent_cost_center", function() {
            return {
                "filters": {
                    "is_group": 1
                }
            };
        });

        // Set query for segment field
        frm.set_query("segment", function() {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_parent_cost_center,
                    "is_group": 0,
                    "disable": 0

                }
            };
        });

        console.log("Onload: Queries set for custom_cc and segment fields");
        // Set query for custom_cc field in the child table
        frm.fields_dict["items"].grid.get_field("custom_parent_cost_centre").get_query = function() {
            return {
                filters: {
                    is_group: 1
                }
            };
        };

        // Set query for custom_cost_centre field in the child table
        frm.fields_dict["items"].grid.get_field("segment").get_query = function(doc, cdt, cdn) {
            var child = locals[cdt][cdn];
            return {
                filters: {
                    parent_segment: child.custom_parent_cost_centre,
                    is_group: 0,
                    disable: 0
                }
            };
        };

        console.log("Onload: Queries set for custom_cc and custom_cost_centre fields in item table");
    },
    item_group: function(frm) {
        frm.set_query("segment", function() {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_parent_cost_center,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("item_group changed, query set for segment field");
    },
    custom_parent_cost_center: function(frm, cdt, cdn) {
        frm.set_query("segment", function() {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_parent_cost_center,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("custom_cc field changed, query set for segment field with parent_segment:", frm.doc.custom_cc);

        var child = locals[cdt][cdn];
        frappe.ui.form.on('Purchase Invoice Item', {
            custom_parent_cost_centre: function(frm, cdt, cdn) {
                var child = locals[cdt][cdn];
                frm.fields_dict["items"].grid.get_field("segment").get_query = function() {
                    return {
                        filters: {
                            parent_segment: child.custom_parent_cost_centre,
                            is_group: 0,
                            disable: 0
                        }
                    };
                };

                console.log("custom_cc field changed in item table, query set for custom_cost_centre field with parent_segment:", child.custom_cc);
            }
        });
    }
});

frappe.ui.form.on('Purchase Invoice Item', {
    item_tax_template: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        let rate = item.rate;
        let item_tax_template = item.item_tax_template;

        if (item_tax_template) {
            frappe.db.get_doc('Item Tax Template', item_tax_template)
                .then(doc => {
                    if (doc && doc.gst_rate) {
                        let gst_rate = doc.gst_rate;
                        let gst_rate_with_percentage = `${gst_rate}%`;
                        let gst_rate_number = parseFloat(gst_rate);
                        let calculated_value = (rate * gst_rate_number) / 100;
                        frappe.model.set_value(cdt, cdn, 'custom_calculated_value', calculated_value);

                        // Check if the 'custom_gst_not_receivable' checkbox is checked
                        if (item.custom_gst_not_receivable) {
                            // Add the calculated value to the rate
                            let new_rate = rate + calculated_value;
                            frappe.model.set_value(cdt, cdn, 'rate', new_rate);
                            frappe.model.set_value(cdt, cdn, 'item_tax_template', '');
                        }

                        console.log('Rate:', rate);
                        console.log('GST Rate with Percentage:', gst_rate_with_percentage);
                        console.log('Calculated Value:', calculated_value);
                    }
                });
        } else {
            console.log('Rate:', rate);
            console.log('GST Rate with Percentage: No Tax Template');
        }
    },

    custom_gst_not_receivable: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        let rate = item.rate;
        let calculated_value = item.custom_calculated_value;

        // Check if the checkbox is checked
        if (item.custom_gst_not_receivable) {
            // Add the calculated value to the rate
            let new_rate = rate + calculated_value;
            frappe.model.set_value(cdt, cdn, 'rate', new_rate);
            frappe.model.set_value(cdt, cdn, 'item_tax_template', '');
        }
    }
});
