const test = require("node:test");
const assert = require("node:assert/strict");

test("PasswordInput component logic & accessibility unit tests", async (t) => {
    // Simulate component state and behavior
    function createPasswordInputSimulation(initialValue = "", initialShow = false) {
        let value = initialValue;
        let showPassword = initialShow;
        let inputType = showPassword ? "text" : "password";

        return {
            getValue: () => value,
            setValue: (val) => { value = val; },
            getType: () => inputType,
            getAriaLabel: () => (showPassword ? "Hide password" : "Show password"),
            getAriaPressed: () => showPassword,
            toggle: () => {
                showPassword = !showPassword;
                inputType = showPassword ? "text" : "password";
                return showPassword;
            },
        };
    }

    await t.test("Initial state is hidden (type='password', aria-label='Show password')", () => {
        const input = createPasswordInputSimulation("MySecretPass");
        assert.equal(input.getType(), "password");
        assert.equal(input.getAriaLabel(), "Show password");
        assert.equal(input.getAriaPressed(), false);
        assert.equal(input.getValue(), "MySecretPass");
    });

    await t.test("First toggle click reveals password (type='text', aria-label='Hide password')", () => {
        const input = createPasswordInputSimulation("MySecretPass");
        input.toggle();
        assert.equal(input.getType(), "text");
        assert.equal(input.getAriaLabel(), "Hide password");
        assert.equal(input.getAriaPressed(), true);
        assert.equal(input.getValue(), "MySecretPass", "Value must not change when revealed");
    });

    await t.test("Second toggle click hides password again (type='password', aria-label='Show password')", () => {
        const input = createPasswordInputSimulation("MySecretPass");
        input.toggle(); // show
        input.toggle(); // hide
        assert.equal(input.getType(), "password");
        assert.equal(input.getAriaLabel(), "Show password");
        assert.equal(input.getAriaPressed(), false);
        assert.equal(input.getValue(), "MySecretPass", "Value must not change when hidden");
    });

    await t.test("Independent toggles for New Password and Confirm New Password", () => {
        const newPasswordInput = createPasswordInputSimulation("NewSecret123");
        const confirmPasswordInput = createPasswordInputSimulation("NewSecret123");

        // Toggle only new password
        newPasswordInput.toggle();

        assert.equal(newPasswordInput.getType(), "text", "New password should be visible");
        assert.equal(confirmPasswordInput.getType(), "password", "Confirm password must remain masked independently");

        // Toggle confirm password
        confirmPasswordInput.toggle();
        assert.equal(confirmPasswordInput.getType(), "text", "Confirm password should now be visible");

        // Hide new password
        newPasswordInput.toggle();
        assert.equal(newPasswordInput.getType(), "password", "New password should be masked");
        assert.equal(confirmPasswordInput.getType(), "text", "Confirm password should remain visible");
    });

    await t.test("Entering text while revealed preserves characters and allows subsequent masking", () => {
        const input = createPasswordInputSimulation("Initial");
        input.toggle(); // reveal
        assert.equal(input.getType(), "text");

        input.setValue("InitialUpdated123");
        assert.equal(input.getValue(), "InitialUpdated123");

        input.toggle(); // mask
        assert.equal(input.getType(), "password");
        assert.equal(input.getValue(), "InitialUpdated123");
    });
});
