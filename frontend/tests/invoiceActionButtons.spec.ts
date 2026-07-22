// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount, shallowMount } from "@vue/test-utils";

describe("InvoiceActionButtons", () => {
	it("does not render share last invoice in the invoice summary actions", async () => {
		vi.stubGlobal("__", (value: string) => value);
		const { default: InvoiceActionButtons } = await import(
			"../src/posapp/components/pos/invoice/InvoiceActionButtons.vue"
		);

		const wrapper = shallowMount(InvoiceActionButtons, {
			props: {
				pos_profile: {
					custom_allow_select_sales_order: 0,
					posa_allow_return: 1,
					posa_allow_print_draft_invoices: 1,
				},
			},
			global: {
				stubs: {
					VRow: { template: "<div><slot /></div>" },
					VCol: { template: "<div><slot /></div>" },
					VBtn: {
						props: ["prependIcon"],
						template: "<button><slot /></button>",
					},
				},
			},
		});

		expect(wrapper.text()).not.toContain("Share Last Invoice");
		expect((InvoiceActionButtons as any).emits).not.toContain("share-last");
	});

	const BoxStub = defineComponent({
		setup(_, { slots }) {
			return () => h("div", {}, slots.default?.());
		},
	});

	// No declared emits, so the parent's @click falls through to the root <button>
	// as a native listener and trigger("click") invokes it directly.
	const VBtnStub = defineComponent({
		setup(_, { slots }) {
			return () => h("button", {}, slots.default?.());
		},
	});

	// Assert via listener props rather than wrapper.emitted(): emitted() does not
	// record this component's emits under mount + component stubs.
	const mountWith = async (props: Record<string, unknown>) => {
		vi.stubGlobal("__", (value: string) => value);
		const { default: InvoiceActionButtons } = await import(
			"../src/posapp/components/pos/invoice/InvoiceActionButtons.vue"
		);

		const onCreditSaleSubmit = vi.fn();
		const onShowPayment = vi.fn();
		const wrapper = mount(InvoiceActionButtons, {
			props: { ...props, onCreditSaleSubmit, onShowPayment },
			global: {
				components: {
					VRow: BoxStub,
					VCol: BoxStub,
					VBtn: VBtnStub,
				},
			},
		});

		return { wrapper, onCreditSaleSubmit, onShowPayment };
	};

	const quickCreditSaleProfile = {
		posa_allow_credit_sale: 1,
		posa_credit_sale_quick_submit: 1,
	};

	const primaryButton = (wrapper: any) => {
		const buttons = wrapper.findAll("button");
		return buttons[buttons.length - 1];
	};

	it("turns the primary action into a direct submit when quick credit sale is on", async () => {
		const { wrapper, onCreditSaleSubmit, onShowPayment } = await mountWith({
			pos_profile: quickCreditSaleProfile,
		});

		const primary = primaryButton(wrapper);
		expect(primary.text()).toContain("SUBMIT & PRINT");

		await primary.trigger("click");

		expect(onCreditSaleSubmit).toHaveBeenCalledTimes(1);
		expect(onShowPayment).not.toHaveBeenCalled();
	});

	it("keeps a secondary action for collecting payment immediately", async () => {
		const { wrapper, onCreditSaleSubmit, onShowPayment } = await mountWith({
			pos_profile: quickCreditSaleProfile,
		});

		expect(wrapper.text()).toContain("Collect Payment");

		const collect = wrapper
			.findAll("button")
			.find((button: any) => button.text().includes("Collect Payment"));
		await collect.trigger("click");

		expect(onShowPayment).toHaveBeenCalledTimes(1);
		expect(onCreditSaleSubmit).not.toHaveBeenCalled();
	});

	it("keeps PAY opening the payment screen when the profile does not opt in", async () => {
		const { wrapper, onCreditSaleSubmit, onShowPayment } = await mountWith({
			pos_profile: { posa_allow_credit_sale: 1 },
		});

		const primary = primaryButton(wrapper);
		expect(primary.text()).toContain("PAY");
		expect(wrapper.text()).not.toContain("SUBMIT & PRINT");
		expect(wrapper.text()).not.toContain("Collect Payment");

		await primary.trigger("click");

		expect(onShowPayment).toHaveBeenCalledTimes(1);
		expect(onCreditSaleSubmit).not.toHaveBeenCalled();
	});

	it("keeps PAY opening the payment screen on returns", async () => {
		const { wrapper } = await mountWith({
			pos_profile: quickCreditSaleProfile,
			isReturn: true,
		});

		expect(primaryButton(wrapper).text()).toContain("PAY");
		expect(wrapper.text()).not.toContain("SUBMIT & PRINT");
	});
});
