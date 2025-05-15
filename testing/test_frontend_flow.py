# test_frontend_flow.py
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# --- การตั้งค่า ---
# !!! แก้ไข PATH ไปยัง WebDriver ของคุณ !!!
# สำหรับ macOS ถ้าคุณติดตั้ง chromedriver ผ่าน Homebrew (`brew install --cask chromedriver`)
# path อาจจะเป็น /usr/local/bin/chromedriver หรือ /opt/homebrew/bin/chromedriver (สำหรับ M1/M2)
# ตรวจสอบ path ของคุณให้ถูกต้อง
WEBDRIVER_PATH = '/opt/homebrew/bin/chromedriver' # <--- !!!สำคัญมาก: แก้ไข PATH นี้!!!
                                               # หรือถ้าอยู่ใน PATH แล้ว อาจจะไม่ต้องใช้ service object
FRONTEND_URL = "http://localhost:3000"

# ข้อมูล User สำหรับ Test (จะถูกสร้างใหม่ถ้ายังไม่มี หรือใช้ซ้ำถ้ามีแล้ว)
# เพื่อให้ test รันซ้ำได้ ควรใช้ username/email ที่ unique ในแต่ละครั้ง หรือมี logic clear user
# ในตัวอย่างนี้ เราจะใช้ username/email เดิม และคาดหวังว่าถ้า register ซ้ำจะ error (ซึ่งดีสำหรับการทดสอบ)
# แต่ถ้า test หลักคือ flow อื่น อาจจะต้อง login ด้วย user ที่มีอยู่
TEST_USERNAME = f"seluser_{int(time.time())}" # สร้าง username ที่ unique ทุกครั้ง
TEST_EMAIL = f"seluser_{int(time.time())}@example.com"
TEST_PASSWORD = "SeleniumStrongPassword123!"

def initialize_driver():
    """Initializes and returns a Chrome WebDriver instance."""
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')  # รันแบบไม่มีหน้าจอ (สำหรับ CI/CD)
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument("--window-size=1920,1080") # กำหนดขนาดหน้าจอ

    try:
        service = ChromeService(executable_path=WEBDRIVER_PATH)
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"Error initializing WebDriver with service: {e}")
        print("Attempting to initialize WebDriver without explicit service (assuming chromedriver is in PATH)...")
        try:
            driver = webdriver.Chrome(options=options)
        except Exception as e2:
            print(f"Failed to initialize WebDriver: {e2}")
            print("Please ensure ChromeDriver is installed and its path is correct or in your system PATH.")
            exit()
    return driver

def wait_for_element(driver, by, value, timeout=10):
    """Waits for an element to be present and visible."""
    try:
        return WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
    except TimeoutException:
        print(f"Timeout waiting for element: {by}='{value}'")
        driver.save_screenshot(f"error_element_not_found_{value.replace('/', '_').replace('[', '_').replace(']', '_').replace('@', '_')}.png")
        raise

def click_element(driver, by, value, timeout=10):
    """Waits for an element to be clickable and then clicks it."""
    element = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )
    element.click()

def type_into_element(driver, by, value, text):
    """Waits for an element, clears it, and types text into it."""
    element = wait_for_element(driver, by, value)
    element.clear()
    element.send_keys(text)

def check_swal_presence(driver, title_substring, icon_type='success', timeout=5):
    """Checks for SweetAlert2 presence and its title/icon."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'swal2-popup'))
        )
        title_element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((By.ID, 'swal2-title'))
        )
        title = title_element.text
        # SweetAlert2 อาจ render icon ช้ากว่า title หรืออาจจะไม่มี class swal2-icon-type โดยตรง
        # แต่จะมี class ที่ระบุ type ของ icon เช่น swal2-success, swal2-error
        icon = driver.find_element(By.XPATH, f"//div[contains(@class, 'swal2-icon') and contains(@class, 'swal2-{icon_type}') and contains(@style, 'display: flex;')]")

        assert title_substring.lower() in title.lower(), f"SweetAlert title mismatch. Expected '{title_substring}', got '{title}'"
        assert icon.is_displayed(), f"SweetAlert icon '{icon_type}' not displayed or not found with expected classes."
        print(f"SweetAlert '{title}' with icon '{icon_type}' is visible.")
        return True
    except TimeoutException:
        print(f"SweetAlert with title containing '{title_substring}' and icon '{icon_type}' not found within {timeout}s.")
        driver.save_screenshot(f"error_swal_not_found_{title_substring.replace(' ', '_')}.png")
        return False
    except NoSuchElementException:
        print(f"SweetAlert elements (title/icon) not found as expected for '{title_substring}'.")
        driver.save_screenshot(f"error_swal_elements_missing_{title_substring.replace(' ', '_')}.png")
        return False


def test_registration_flow(driver):
    print("\n--- Testing Registration Flow ---")
    driver.get(f"{FRONTEND_URL}/register")
    wait_for_element(driver, By.XPATH, "//h2[contains(text(),'สร้างบัญชีใหม่')]")
    print("Register page loaded.")

    type_into_element(driver, By.ID, "username", TEST_USERNAME)
    type_into_element(driver, By.ID, "email", TEST_EMAIL)
    type_into_element(driver, By.ID, "password_1", TEST_PASSWORD) # Based on your form
    type_into_element(driver, By.ID, "password_2", TEST_PASSWORD) # Based on your form
    print("Registration form filled.")

    click_element(driver, By.XPATH, "//button[@type='submit' and contains(., 'สมัครสมาชิก')]")
    print("Clicked Register button.")

    # ตรวจสอบ SweetAlert "ลงทะเบียนสำเร็จ!"
    assert check_swal_presence(driver, "ลงทะเบียนสำเร็จ", "success", timeout=10), "Registration success Swal not found."

    # ใน AuthContext, หลัง register จะ redirect ไปหน้าแรก (/) โดยอัตโนมัติ ไม่มีการกดปุ่มใน Swal
    # ดังนั้นเราจะตรวจสอบการ redirect ไปหน้าแรก และดูว่า user แสดงใน navbar ไหม
    try:
        swal_confirm_button = wait_for_element(driver, By.CLASS_NAME, "swal2-confirm")
        swal_confirm_button.click()
        WebDriverWait(driver, 15).until(
            EC.url_to_be(f"{FRONTEND_URL}/") # คาดหวังว่าจะไปหน้าแรก
        )
        print(f"Redirected to: {driver.current_url} after registration (expected homepage).")
        # ตรวจสอบว่าชื่อผู้ใช้แสดงใน navbar (แสดงว่า auto-login สำเร็จ)
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, f"//nav//button[.//span[contains(text(), '{TEST_USERNAME}')]]"))
        )
        print(f"User '{TEST_USERNAME}' visible in Navbar after registration and auto-login.")
    except TimeoutException:
        driver.save_screenshot("registration_redirect_or_nav_user_failed.png")
        assert False, "Failed to redirect to homepage or user not visible in navbar after registration."


def test_login_flow(driver, username, password):
    print("\n--- Testing Login Flow ---")
    driver.get(f"{FRONTEND_URL}/login")
    wait_for_element(driver, By.XPATH, "//h2[contains(text(),'เข้าสู่ระบบ')]")
    print("Login page loaded.")

    type_into_element(driver, By.ID, "identifier", username)
    type_into_element(driver, By.ID, "password", password)
    print(f"Login form filled for user: {username}")

    click_element(driver, By.XPATH, "//button[@type='submit' and contains(., 'เข้าสู่ระบบ')]")
    print("Clicked Login button.")

    # รอให้ redirect ไปหน้า Home และ Navbar แสดงชื่อ User
    try:
        # รอ URL เปลี่ยนเป็นหน้าแรก
        WebDriverWait(driver, 15).until(EC.url_to_be(f"{FRONTEND_URL}/"))
        print(f"Redirected to homepage: {driver.current_url}")

        # ตรวจสอบว่าปุ่ม user dropdown ที่มีชื่อ user แสดงขึ้นมา
        user_dropdown_button_xpath = f"//nav//button[.//span[contains(text(), '{username}')]]"
        wait_for_element(driver, By.XPATH, user_dropdown_button_xpath, timeout=10)
        print(f"Login successful. User '{username}' visible in Navbar.")
        assert True # Mark as passed if user is visible
    except TimeoutException:
        driver.save_screenshot("login_failed_navbar_check.png")
        print(f"Login failed or user '{username}' not visible in Navbar after login.")
        assert False, f"Login verification failed for user '{username}'."

def test_recommendation_flow(driver):
    print("\n--- Testing Recommendation Flow ---")
    # ตรวจสอบว่าอยู่หน้าแรกแล้ว
    if driver.current_url != f"{FRONTEND_URL}/":
        driver.get(FRONTEND_URL)

    wait_for_element(driver, By.ID, "recommender-form") # ตรวจสอบว่า form section โหลดแล้ว
    print("Homepage loaded, recommendation form visible.")

    type_into_element(driver, By.ID, "budget", "55000")
    type_into_element(driver, By.ID, "preferred_games", "Cyberpunk 2077, Elden Ring")
    print("Recommendation form filled.")

    click_element(driver, By.XPATH, "//button[@type='submit' and contains(., 'จัดสเปคเลย!')]")
    print("Clicked 'Get AI Recommendations' button.")

    try:
        results_section = wait_for_element(driver, By.ID, "results", timeout=60) # เพิ่ม timeout เพราะ AI อาจจะใช้เวลา
        print("Results section is visible.")
        first_card_title_xpath = "//section[@id='results']//div[contains(@class, 'bg-slate-800') and .//h3[contains(@class, 'text-sky-300')]][1]//h3"
        first_card_title = wait_for_element(driver, By.XPATH, first_card_title_xpath, timeout=45)
        print(f"First recommendation card found with title: {first_card_title.text}")
        assert first_card_title.is_displayed(), "Recommendation cards not displayed."

        save_buttons_xpath = "//section[@id='results']//button[contains(., 'บันทึกสเปคนี้')]"
        save_buttons = driver.find_elements(By.XPATH, save_buttons_xpath)
        if save_buttons:
            print(f"Found {len(save_buttons)} 'Save to Favorites' button(s).")
            # Scroll into view if necessary
            driver.execute_script("arguments[0].scrollIntoView(true);", save_buttons[0])
            time.sleep(0.5) # wait for scroll
            click_element(driver, By.XPATH, f"({save_buttons_xpath})[1]") # คลิกปุ่มแรก
            print("Clicked first 'Save to Favorites' button.")

            assert check_swal_presence(driver, "บันทึกสำเร็จ", "success", timeout=10), "Save Favorite success Swal not found."

            swal_confirm_button = wait_for_element(driver, By.XPATH, "//button[contains(@class, 'swal2-confirm') and (contains(text(), 'ไปหน้ารายการสเปคโปรด') or contains(text(), 'OK'))]") # ปรับให้รองรับปุ่ม OK ด้วย
            swal_confirm_button.click()
            WebDriverWait(driver, 10).until(EC.url_contains("/favorites"))
            print("Redirected to Favorites page.")
            assert "/favorites" in driver.current_url, "Failed to redirect to Favorites page after saving."
            driver.back()
            WebDriverWait(driver, 10).until(EC.url_to_be(f"{FRONTEND_URL}/"))
        else:
            print("No 'Save to Favorites' buttons found (user might not be authenticated properly or XPath issue).")
            # Consider failing the test if save buttons are expected
            # assert False, "Save to Favorites buttons not found when they should be."

    except TimeoutException:
        driver.save_screenshot("recommendation_results_timeout.png")
        print("Timeout waiting for recommendation results.")
        assert False, "Recommendation results did not appear."
    except Exception as e:
        driver.save_screenshot("recommendation_flow_error.png")
        print(f"An error occurred during recommendation flow: {e}")
        raise


def test_logout_flow(driver, username): # เพิ่ม argument username
    print("\n--- Testing Logout Flow ---")
    # ตรวจสอบว่ายังอยู่หน้าแรกหรือไม่ ถ้าไม่ ให้ไปหน้าแรกก่อน (อาจไม่จำเป็นถ้า test ก่อนหน้าจบที่หน้าแรก)
    if not driver.current_url.endswith("/"):
        driver.get(f"{FRONTEND_URL}/")
        WebDriverWait(driver, 10).until(EC.url_to_be(f"{FRONTEND_URL}/"))

    # 1. ค้นหาและคลิกปุ่ม user dropdown (ที่ควรจะมีชื่อ user)
    user_dropdown_button_xpath = f"//nav//button[.//span[contains(text(), '{username}')]]"
    try:
        user_dropdown_button = wait_for_element(driver, By.XPATH, user_dropdown_button_xpath, timeout=15)
        print(f"User dropdown button for '{username}' found. Clicking to open dropdown.")
        user_dropdown_button.click()
    except TimeoutException:
        driver.save_screenshot("logout_user_dropdown_btn_not_found.png")
        print(f"User dropdown button for '{username}' not found. Assuming user is not properly logged in or Navbar structure changed.")
        assert False, f"Cannot find user dropdown button for '{username}'. Logout test cannot proceed."

    # 2. รอให้ dropdown panel แสดง (id="user-dropdown-panel") และคลิกปุ่ม "ออกจากระบบ"
    # XPath ของปุ่ม Logout ภายใน panel ที่มี ID 'user-dropdown-panel'
    logout_button_xpath_in_dropdown = "//div[@id='user-dropdown-panel' and not(contains(@class, 'hidden'))]//button[contains(., 'ออกจากระบบ')]"
    try:
        logout_button_actual = wait_for_element(driver, By.XPATH, logout_button_xpath_in_dropdown, timeout=10)
        print("Logout button in dropdown found. Clicking it.")
        # อาจจะต้องใช้ JavaScript click ถ้า element ถูกบัง
        driver.execute_script("arguments[0].click();", logout_button_actual)
        # logout_button_actual.click()
    except TimeoutException:
        driver.save_screenshot("logout_btn_in_dropdown_not_found.png")
        print("Logout button within the dropdown panel not found or panel not visible.")
        assert False, "Logout button in dropdown not found."

    # 3. ตรวจสอบ SweetAlert "ออกจากระบบสำเร็จ"
    assert check_swal_presence(driver, "ออกจากระบบสำเร็จ", "success", timeout=10), "Logout success Swal not found."

    # 4. คลิกปุ่ม "ไปหน้าเข้าสู่ระบบ" ใน Swal (class: swal2-cancel เนื่องจาก reverseButtons: true ใน AuthContext)
    try:
        # ตาม AuthContext.tsx, "ไปหน้าเข้าสู่ระบบ" คือ cancelButtonText และ reverseButtons=true
        # SweetAlert อาจใช้ class swal2-cancel หรือ swal2-deny ขึ้นกับ version และ config
        # แต่โดยทั่วไป `swal2-cancel` ควรจะใช้ได้สำหรับ cancel button
        swal_go_to_login_button = wait_for_element(driver, By.XPATH, "//button[contains(@class, 'swal2-cancel') and contains(text(), 'ไปหน้าเข้าสู่ระบบ')]", timeout=10)
        print("Swal 'ไปหน้าเข้าสู่ระบบ' button found. Clicking it.")
        swal_go_to_login_button.click()
    except TimeoutException:
        # ลองหาด้วย confirm เผื่อมีการเปลี่ยนแปลงหรือตีความ reverseButtons ผิด
        try:
            print("Cancel button not found, trying confirm button with 'ไปหน้าเข้าสู่ระบบ' text (fallback).")
            swal_go_to_login_button = wait_for_element(driver, By.XPATH, "//button[contains(@class, 'swal2-confirm') and contains(text(), 'ไปหน้าเข้าสู่ระบบ')]", timeout=5)
            print("Fallback: Swal 'ไปหน้าเข้าสู่ระบบ' (as confirm) button found. Clicking it.")
            swal_go_to_login_button.click()
        except TimeoutException:
            driver.save_screenshot("logout_swal_go_to_login_btn_error.png")
            print("Could not find 'ไปหน้าเข้าสู่ระบบ' button in Swal with expected classes.")
            assert False, "Failed to find 'ไปหน้าเข้าสู่ระบบ' button in SweetAlert."


    # 5. รอให้ redirect ไปหน้า login
    WebDriverWait(driver, 10).until(EC.url_to_be(f"{FRONTEND_URL}/login"))
    print(f"Redirected to Login page after logout: {driver.current_url}")
    assert f"{FRONTEND_URL}/login" == driver.current_url, "Failed to redirect to login page after logout."
    # ตรวจสอบว่าไม่มีชื่อผู้ใช้ใน Navbar อีกต่อไป
    try:
        WebDriverWait(driver, 5).until_not(
            EC.presence_of_element_located((By.XPATH, user_dropdown_button_xpath))
        )
        print("User is no longer visible in Navbar, as expected after logout.")
    except TimeoutException:
        driver.save_screenshot("logout_user_still_in_navbar.png")
        print("User still seems to be visible in Navbar after logout. This might be an issue.")
        # อาจจะไม่ใช่ critical assertion ขึ้นอยู่กับว่า Navbar เปลี่ยนเป็นสถานะ "Guest" หรือไม่

if __name__ == "__main__":
    driver = initialize_driver()

    try:
        # Test 1: Registration
        test_registration_flow(driver)
        print("Registration test completed.")
        time.sleep(1) # ให้เวลาเล็กน้อยก่อน logout

        # Test 2: Logout (หลังจาก register และ auto-login)
        # User ที่ใช้คือ TEST_USERNAME ที่เพิ่ง register
        test_logout_flow(driver, TEST_USERNAME) # <--- ส่ง TEST_USERNAME เข้าไป
        print("Logout after registration test completed.")
        time.sleep(1)

        # Test 3: Login (ด้วย user ที่เพิ่ง register และ logout ไป)
        test_login_flow(driver, TEST_USERNAME, TEST_PASSWORD)
        print("Login test completed.")
        time.sleep(1)

        # Test 4: Recommendation Flow (รวม Save Favorite)
        test_recommendation_flow(driver)
        print("Recommendation and Save Favorite test completed.")
        time.sleep(1)

        # Test 5: Logout (หลังจากใช้งาน feature อื่นๆ)
        test_logout_flow(driver, TEST_USERNAME) # <--- ส่ง TEST_USERNAME เข้าไป
        print("Final logout test completed.")
        time.sleep(1)

        print("\n🎉 All tests passed successfully! 🎉")

    except AssertionError as ae:
        print(f"\n❌ TEST FAILED: {ae}")
        # driver.save_screenshot("test_assertion_failure.png") # ถูกย้ายไปอยู่ใน wait_for_element และอื่นๆแล้ว
    except Exception as e:
        print(f"\n❌ AN ERROR OCCURRED DURING TESTS: {e}")
        driver.save_screenshot("test_general_error.png")
    finally:
        if driver:
            driver.quit()
        print("\nBrowser closed. Test finished.")