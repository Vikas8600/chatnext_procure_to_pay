frappe.ui.form.on('Purchase Receipt', {

    custom_group_warehousee: function (frm) {

        let group_warehouse = frm.doc.custom_group_warehousee;


        frm.doc.items.forEach(function (item) {
            item.custom_group_warehouse = group_warehouse;
        });


        frm.refresh_field('items');
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

    custom_cc: function (frm) {
        let customCC = frm.doc.custom_cc;

        frm.doc.items.forEach(function (item) {
            item.custom_parent_cost_centre = customCC;
        });
    },

    refresh: function (frm) {
        // Ensure the items table is updated when the form is refreshed
        if (frm.doc.segment) {
            frm.doc.items.forEach(function (item) {
                item.segment = frm.doc.segment;
            });
        }

        if (frm.doc.custom_cc) {
            frm.doc.items.forEach(function (item) {
                item.custom_parent_cost_centre = frm.doc.custom_cc;
            });
        }

        frm.refresh_field('items');
    },
    onload: function (frm) {
        // Set query for custom_cc field
        frm.set_query("custom_cc", function () {
            return {
                "filters": {
                    "is_group": 1
                }
            };
        });

        // Set query for segment field
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0

                }
            };
        });
        console.log("Onload: Queries set for custom_cc and segment fields");
        frm.set_query("custom_group_warehousee", function () {
            return {
                "filters": {
                    "is_group": 1,
                }
            };
        });
        cur_frm.set_query("set_warehouse", function () {
            return {
                "filters": {
                    'parent_warehouse': frm.doc.custom_group_warehousee,
                    "is_group": 0,
                }
            };
        });
        frm.set_query("custom_group_warehousee", function () {
            return {
                "filters": {
                    "is_group": 1,
                }
            };
        });

    },
    // Trigger when custom_cc field is changed
    custom_cc: function (frm) {
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("custom_cc field changed, query set for segment field with parent_segment:", frm.doc.custom_cc);
    },

    item_group: function (frm) {
        frm.set_query("segment", function () {
            return {
                "filters": {
                    'parent_segment': frm.doc.custom_cc,
                    "is_group": 0,
                    "disable": 0
                }
            };
        });

        console.log("item_group changed, query set for segment field");
        frm.set_query("set_warehouse", function () {
            return {
                "filters": {
                    'parent_warehouse': frm.doc.custom_group_warehousee,
                    "is_group": 0,
                }
            };
        });
    }
});
