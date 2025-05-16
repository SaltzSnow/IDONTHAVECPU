# recommender_api/services.py
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
import decimal 

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY is not set in .env file. AI recommendations will not work.")


def generate_prompt(budget, currency="THB", desired_parts=None, preferred_games=None):
    """
    สร้าง prompt สำหรับ Gemini API โดยเน้นราคาในประเทศไทย และความถูกต้องของราคารวม
    """
    if not desired_parts:
        desired_parts = {}

    prompt_lines = [
        "โปรดทำหน้าที่เป็นผู้เชี่ยวชาญในการจัดสเปคคอมพิวเตอร์ โดยอ้างอิงราคาจากในเว็บ JIB, Advice, Banana IT (Thailand) เป็นหลัก ณ เวลาปัจจุบัน อย่างน้อย 3 แบบหรือมากกว่าที่แตกต่างกัน",
        f"ผู้ใช้มีงบประมาณ {budget:,.0f} บาทไทย (THB).",
        "กรุณาพิจารณาราคาตลาดปัจจุบันของส่วนประกอบต่างๆ ที่มีจำหน่ายในประเทศไทยอย่างละเอียด"
    ]

    json_output_format_details = [
        "สำหรับแต่ละแบบ กรุณาให้ข้อมูลต่อไปนี้ในรูปแบบ JSON object ที่ถูกต้อง:",
        "- build_name: ชื่อชุดสเปค (string, เช่น 'ชุดเริ่มต้นคุ้มค่าสำหรับเกมเมอร์ไทย')",
        "- total_price_estimate_thb: ราคาประเมินรวม (ตัวเลข บาทไทย). **สำคัญมาก: ราคารวมนี้จะต้องเป็นผลรวมที่แม่นยำของ 'price_thb' จากส่วนประกอบทุกชิ้น (cpu, gpu, ram, storage, motherboard, psu, case, cooler) ที่คุณระบุไว้ในชุดสเปคนี้เท่านั้น ห้ามปัดเศษหรือรวมค่าใช้จ่ายอื่นที่ไม่ได้ระบุในรายการส่วนประกอบ.**",
        "- cpu: object ที่มี key 'name' (string, ยี่ห้อและรุ่น) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- gpu: object ที่มี key 'name' (string, ยี่ห้อและรุ่น) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- ram: object ที่มี key 'name' (string, ความจุและความเร็ว) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- storage: object ที่มี key 'name' (string, ประเภทและความจุ) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- motherboard: object ที่มี key 'name' (string, ชิปเซ็ตหรือประเภทที่เข้ากันได้) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- psu: object ที่มี key 'name' (string, กำลังไฟและมาตรฐาน) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- case: object ที่มี key 'name' (string, ประเภททั่วไป) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- cooler: object ที่มี key 'name' (string, ถ้าจำเป็น หรือแนะนำรุ่นที่คุ้มค่าในไทย) และ 'price_thb' (ตัวเลข, ราคาประเมินในไทย)",
        "- notes: หมายเหตุสั้นๆ (string) เกี่ยวกับความเหมาะสมของชุดนี้ในตลาดไทย และเหตุผลหลักที่เลือกส่วนประกอบ (ถ้ามี)",
        "เน้นส่วนประกอบที่มีความสมดุลระหว่างประสิทธิภาพและราคาที่หาได้ในประเทศไทย",
        "ตรวจสอบให้แน่ใจว่าส่วนประกอบทั้งหมดเข้ากันได้"
    ]

    example_cpu_price = 5000
    example_gpu_price = 10000
    example_ram_price = 1800
    example_storage_price = 2200
    example_mb_price = 3000
    example_psu_price = 2000
    example_case_price = 1500
    example_cooler_price = 700
    example_total_price = (example_cpu_price + example_gpu_price + example_ram_price +
                           example_storage_price + example_mb_price + example_psu_price +
                           example_case_price + example_cooler_price)

    example_json_object = f"""
    {{
        "build_name": "ชุดสุดคุ้มเกมมิ่งไทยแลนด์ตัวอย่าง",
        "total_price_estimate_thb": {example_total_price},
        "cpu": {{ "name": "AMD Ryzen 5 5600 (ตัวอย่าง)", "price_thb": {example_cpu_price} }},
        "gpu": {{ "name": "NVIDIA GeForce RTX 3060 12GB (ตัวอย่าง)", "price_thb": {example_gpu_price} }},
        "ram": {{ "name": "16GB (2x8GB) DDR4 3200MHz (ตัวอย่าง)", "price_thb": {example_ram_price} }},
        "storage": {{ "name": "1TB NVMe SSD M.2 PCIe Gen3 (ตัวอย่าง)", "price_thb": {example_storage_price} }},
        "motherboard": {{ "name": "B550 Chipset Motherboard (AM4) (ตัวอย่าง)", "price_thb": {example_mb_price} }},
        "psu": {{ "name": "650W 80+ Bronze (ตัวอย่าง)", "price_thb": {example_psu_price} }},
        "case": {{ "name": "ATX Mid-Tower Case (ดีไซน์ระบายอากาศดี) (ตัวอย่าง)", "price_thb": {example_case_price} }},
        "cooler": {{ "name": "Stock Cooler or Budget Air Cooler (ถ้าจำเป็น) (ตัวอย่าง)", "price_thb": {example_cooler_price} }},
        "notes": "นี่คือตัวอย่างโครงสร้าง JSON ที่ต้องการ ราคารวมจะต้องตรงกับผลบวกของราคาส่วนประกอบทุกชิ้น"
    }}
    """

    is_budget_only_scenario = not (desired_parts and any(desired_parts.values())) and not preferred_games
    
    if is_budget_only_scenario:
        prompt_lines.extend([
            "ช่วยแนะนำสเปคคอมพิวเตอร์ที่คุ้มค่าที่สุดสำหรับงบประมาณนี้ โดยเน้นความคุ้มค่า ณ เวลาปัจจุบันของราคาในประเทศไทย",
        ])
        prompt_lines.extend(json_output_format_details)
        prompt_lines.append("ส่งผลลัพธ์เป็น JSON array ของ object โดยแต่ละ object คือหนึ่งสเปค ตามรูปแบบที่ระบุข้างต้น")
        prompt_lines.append("ตัวอย่าง object หนึ่งสเปคใน array (ราคาเป็นตัวอย่าง โปรดใช้ราคาตลาดจริงในไทย ณ เวลาปัจจุบัน และราคารวมต้องตรงกับผลบวกของส่วนประกอบ):")
        prompt_lines.append(example_json_object)
    else: 
        if desired_parts and any(desired_parts.values()):
            prompt_lines.append("ผู้ใช้ได้ระบุส่วนประกอบบางส่วนที่ต้องการดังนี้ (หากส่วนประกอบเหล่านี้มีราคาสูงหรือหายากในไทย ณ เวลาปัจจุบัน โปรดแนะนำทางเลือกที่ใกล้เคียงและคุ้มค่ากว่า และปรับราคารวมให้สอดคล้อง):")
            if desired_parts.get("cpu"): prompt_lines.append(f"- CPU ที่ต้องการ: {desired_parts['cpu']}")
            if desired_parts.get("gpu"): prompt_lines.append(f"- GPU ที่ต้องการ: {desired_parts['gpu']}")
            if desired_parts.get("ram"): prompt_lines.append(f"- RAM ที่ต้องการ: {desired_parts['ram']}")
            if desired_parts.get("storage_type"): prompt_lines.append(f"- ประเภท Storage: {desired_parts['storage_type']}")
            if desired_parts.get("storage_size"): prompt_lines.append(f"- ขนาด Storage: {desired_parts['storage_size']}")
            if desired_parts.get("motherboard_chipset"): prompt_lines.append(f"- Chipset Motherboard: {desired_parts['motherboard_chipset']}")
            if desired_parts.get("psu_wattage"): prompt_lines.append(f"- PSU Wattage: {desired_parts['psu_wattage']}")
            prompt_lines.append("ช่วยวิเคราะห์และแนะนำสเปคคอมพิวเตอร์ส่วนที่เหลือให้ครบถ้วนตามงบประมาณ โดยอ้างอิงราคาตลาดในประเทศไทย ณ เวลาปัจจุบัน")
        else:
            prompt_lines.append("ผู้ใช้ไม่ได้ระบุส่วนประกอบใดเป็นพิเศษ")

        if preferred_games:
            games_list_str = ", ".join(preferred_games)
            prompt_lines.append(f"ผู้ใช้ต้องการเล่นเกมเหล่านี้ให้ลื่นไหล: {games_list_str}.")
            prompt_lines.append("ช่วยวิเคราะห์และแนะนำสเปคคอมพิวเตอร์ที่สามารถเล่นเกมเหล่านี้ได้อย่างลื่นไหลที่สุดภายใต้งบประมาณที่กำหนด โดยคำนึงถึงราคาและความพร้อมจำหน่ายของชิ้นส่วนในประเทศไทย ณ เวลาปัจจุบัน")
            prompt_lines.append("ให้ความสำคัญกับ GPU และ CPU ที่ให้ประสิทธิภาพดีต่อราคาในตลาดไทย สำหรับเกมที่ระบุ")
        else:
            prompt_lines.append("ช่วยวิเคราะห์และแนะนำสเปคคอมพิวเตอร์ที่ให้ประสิทธิภาพโดยรวมดีที่สุดภายใต้งบประมาณ โดยเน้นความคุ้มค่าตามราคาในประเทศไทย ณ เวลาปัจจุบัน")

        prompt_lines.extend(json_output_format_details)
        prompt_lines.append("ส่งผลลัพธ์เป็น JSON object หนึ่งชุด (ถ้ามีสเปคเดียวที่เหมาะสม) หรือ JSON array ที่มี 1-2 object (ถ้ามีทางเลือกที่เหมาะสมหลายแบบ) โดยราคาทั้งหมดให้เป็น บาทไทย (THB) ทั้งหมด, เป็นตัวเลข, และราคารวมต้องตรงกับผลบวกของส่วนประกอบ")
        prompt_lines.append(example_json_object)

    prompt_lines.append("\nย้ำอีกครั้ง: ผลลัพธ์ทั้งหมดจะต้องเป็น JSON ที่ถูกต้องเท่านั้น ไม่มีข้อความอื่นนอกเหนือจาก JSON และราคารวม `total_price_estimate_thb` จะต้องเท่ากับผลรวมของ `price_thb` ของส่วนประกอบทุกชิ้นในชุดนั้นๆ อย่างแม่นยำ")
    return "\n".join(prompt_lines)


def get_specs_from_gemini(budget, currency="THB", desired_parts=None, preferred_games=None):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not configured.", "recommendations": []}

    model_currency = "THB"
    prompt = generate_prompt(budget, model_currency, desired_parts, preferred_games)
    model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest")

    raw_gemini_text_output = ""
    try:
        from google.generativeai.types import GenerationConfig
        generation_config = GenerationConfig(
            response_mime_type="application/json",
        )
        response = model.generate_content(prompt, generation_config=generation_config)
        raw_gemini_text_output = response.text
        parsed_json = json.loads(raw_gemini_text_output)

        final_response = {
            "budget_thb": float(budget),
            "currency_provided_to_ai": model_currency,
            "recommendations": [],
            "analysis_notes": "การวิเคราะห์ AI เสร็จสมบูรณ์ อ้างอิงราคาในประเทศไทย ณ พฤษภาคม 2025"
        }

        recommendations_list = []
        if isinstance(parsed_json, list):
            recommendations_list = parsed_json
        elif isinstance(parsed_json, dict) and "build_name" in parsed_json:
            recommendations_list = [parsed_json]
        elif isinstance(parsed_json, dict) and "recommendations" in parsed_json and isinstance(parsed_json["recommendations"], list):
            recommendations_list = parsed_json["recommendations"]
            if "analysis_notes" in parsed_json and isinstance(parsed_json["analysis_notes"], str):
                 final_response["analysis_notes"] = parsed_json["analysis_notes"]
        elif isinstance(parsed_json, dict) and "builds" in parsed_json and isinstance(parsed_json["builds"], list):
            recommendations_list = parsed_json["builds"]
            final_response["analysis_notes"] += " (โครงสร้าง 'builds' จาก AI ถูกใช้โดยตรง)"
            if "analysis_notes" in parsed_json and isinstance(parsed_json["analysis_notes"], str):
                final_response["analysis_notes"] = parsed_json["analysis_notes"]
        
        processed_recommendations = []
        if recommendations_list:
            for build in recommendations_list:
                if not isinstance(build, dict):
                    print(f"Warning: Skipping non-dict item in recommendations_list: {build}")
                    continue

                calculated_sum = decimal.Decimal(0)
                component_keys_for_sum = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooler']
                
                for key in component_keys_for_sum:
                    component_details = build.get(key)
                    if isinstance(component_details, dict) and "price_thb" in component_details:
                        try:
                            price_val = component_details.get("price_thb")
                            if price_val is not None:
                                calculated_sum += decimal.Decimal(str(price_val))
                        except (ValueError, TypeError, decimal.InvalidOperation) as e:
                            print(f"Warning: Invalid price_thb for {key} in build '{build.get('build_name', 'Unknown Build')}': '{component_details.get('price_thb')}'. Error: {e}")
                
                build["calculated_total_price_thb"] = float(calculated_sum)

                gemini_total_str = build.get("total_price_estimate_thb")
                if gemini_total_str is not None:
                    try:
                        gemini_total_decimal = decimal.Decimal(str(gemini_total_str))
                        if abs(gemini_total_decimal - calculated_sum) > decimal.Decimal('1.00'): 
                            print(f"PRICE MISMATCH for build '{build.get('build_name', 'Unknown Build')}': Gemini total: {gemini_total_decimal}, Calculated: {calculated_sum}. OVERRIDING WITH CALCULATED VALUE.")
                            build["total_price_estimate_thb"] = float(calculated_sum)
                            build["price_calculation_note"] = "Total price was recalculated from components for accuracy."
                        else:
                            build["total_price_estimate_thb"] = float(gemini_total_decimal)
                    except (ValueError, TypeError, decimal.InvalidOperation):
                        print(f"Warning: Gemini total_price_estimate_thb '{gemini_total_str}' is not a valid number for build '{build.get('build_name', 'Unknown Build')}'. USING CALCULATED VALUE.")
                        build["total_price_estimate_thb"] = float(calculated_sum)
                        build["price_calculation_note"] = "Gemini total price was invalid, recalculated from components."
                else:
                    print(f"Info: Gemini did not provide total_price_estimate_thb for build '{build.get('build_name', 'Unknown Build')}'. CALCULATING AND ADDING.")
                    build["total_price_estimate_thb"] = float(calculated_sum)
                    build["price_calculation_note"] = "Total price calculated from components as it was missing."
                
                processed_recommendations.append(build)
            final_response["recommendations"] = processed_recommendations
        
        else: 
            if not final_response.get("error"): 
                error_detail_msg = f"Gemini returned JSON in an unhandled top-level structure: {type(parsed_json)}"
                print(f"Warning: {error_detail_msg}")
                print(f"Raw parsed_json from Gemini for debugging (services.py): {parsed_json}")
                final_response["error"] = error_detail_msg
                final_response["raw_ai_output_on_error"] = parsed_json if isinstance(parsed_json, (dict, list)) else raw_gemini_text_output
                final_response["recommendations"] = []

        return final_response

    except json.JSONDecodeError as e:
        error_message = f"เกิดข้อผิดพลาดในการแปลง JSON จาก Gemini: {e}. การตอบกลับดิบ: {raw_gemini_text_output}"
        print(error_message)
        return {
            "error": error_message, "recommendations": [], "budget_thb": float(budget),
            "raw_ai_output_on_error": raw_gemini_text_output
        }
    except Exception as e:
        error_detail = str(e)
        raw_text_for_error = raw_gemini_text_output if raw_gemini_text_output else None
        prompt_feedback_text = None
        if 'response' in locals() and hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            prompt_feedback_text = str(response.prompt_feedback)
            print(f"Prompt Feedback (services.py): {prompt_feedback_text}")
            error_detail = f"AI request was blocked or failed. Feedback: {prompt_feedback_text}"
        else:
            print(f"เกิดข้อผิดพลาดที่ไม่คาดคิด (services.py): {e}")
        return {
            "error": error_detail, "recommendations": [], "budget_thb": float(budget),
            "raw_ai_output_on_error": raw_text_for_error,
            "prompt_feedback_on_error": prompt_feedback_text
        }

def generate_build_explanation_prompt(selected_build: dict, original_query: dict):
    prompt_lines = [
        "โปรดทำหน้าที่เป็นผู้เชี่ยวชาญด้านการจัดสเปคคอมพิวเตอร์และอธิบายเหตุผล",
        "จากคำขอเริ่มต้นของผู้ใช้ดังต่อไปนี้:"
    ]
    if original_query.get("budget"):
        try:
            budget_val = float(original_query['budget'])
            prompt_lines.append(f"- งบประมาณ: {budget_val:,.0f} {original_query.get('currency', 'THB')}")
        except (ValueError, TypeError):
             prompt_lines.append(f"- งบประมาณ: {original_query['budget']} {original_query.get('currency', 'THB')}")

    if original_query.get("desired_parts") and any(original_query["desired_parts"].values()):
        parts_str = ", ".join([f"{k.upper() if len(k) <= 3 else k.capitalize()}: {v}" for k, v in original_query["desired_parts"].items()])
        prompt_lines.append(f"- ส่วนประกอบที่ระบุเป็นพิเศษ: {parts_str if parts_str else 'ไม่มี'}")
    else:
        prompt_lines.append("- ส่วนประกอบที่ระบุเป็นพิเศษ: ไม่ได้ระบุ")

    if original_query.get("preferred_games") and original_query["preferred_games"]:
        games_str = ", ".join(original_query["preferred_games"])
        prompt_lines.append(f"- เกมที่ต้องการเล่น: {games_str}")
    else:
        prompt_lines.append("- เกมที่ต้องการเล่น: ไม่ได้ระบุ")

    prompt_lines.append("\nคุณได้เคยแนะนำสเปคคอมพิวเตอร์หนึ่งชุด (selected build) ดังนี้:")
    if selected_build.get("build_name"):
        prompt_lines.append(f"- ชื่อชุด: {selected_build['build_name']}")
    
    display_total_price = selected_build.get("calculated_total_price_thb", selected_build.get("total_price_estimate_thb"))
    if display_total_price is not None:
        try:
            price_val = float(display_total_price)
            prompt_lines.append(f"- ราคารวมประมาณ (ตามส่วนประกอบ): {price_val:,.0f} THB") 
        except (ValueError, TypeError):
            prompt_lines.append(f"- ราคารวมประมาณ: {display_total_price}")

    component_keys = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'case']
    for key in component_keys:
        component = selected_build.get(key)
        if component:
            name = component.get("name", "N/A") if isinstance(component, dict) else str(component)
            price_info = ""
            if isinstance(component, dict) and component.get("price_thb") is not None:
                try:
                    comp_price = float(component.get("price_thb",0))
                    price_info = f" (ราคาประมาณ {comp_price:,.0f} THB)"
                except (ValueError, TypeError):
                    price_info = f" (ราคา: {component.get('price_thb')})"
            prompt_lines.append(f"- {key.upper()}: {name}{price_info}")

    if selected_build.get("notes"):
        prompt_lines.append(f"- หมายเหตุเดิมของ selected build: {selected_build['notes']}")

    prompt_lines.extend([
        "\nโปรดอธิบายอย่างละเอียดเป็นภาษาไทยว่า เหตุใดสเปคคอมพิวเตอร์ชุดที่เลือก (selected build) นี้โดยรวมจึงเป็นตัวเลือกที่ดีและเหมาะสมสำหรับคำขอเริ่มต้นของผู้ใช้ที่ระบุไว้ข้างต้น?",
        "ในการอธิบาย ให้พิจารณาปัจจัยต่อไปนี้:",
        "1. ความสอดคล้องกับงบประมาณ: ชุดนี้ใช้ประโยชน์จากงบประมาณได้ดีเพียงใด? คุ้มค่าหรือไม่ เมื่อเทียบกับราคารวมของส่วนประกอบ?",
        "2. ประสิทธิภาพสำหรับเกมที่ระบุ (ถ้ามี): สามารถเล่นเกมที่ผู้ใช้ต้องการได้ดีแค่ไหน? มีจุดเด่นอะไรสำหรับเกมนั้นๆ?",
        "3. ความสมดุลของส่วนประกอบ: CPU และ GPU สมดุลกันหรือไม่? RAM เพียงพอหรือไม่? PSU เหมาะสมหรือไม่?",
        "4. เหตุผลในการเลือกส่วนประกอบหลักแต่ละชิ้น (CPU, GPU, RAM) ว่าทำไมถึงเหมาะกับ build นี้ภายใต้เงื่อนไขของผู้ใช้",
        "5. ข้อดีอื่นๆ หรือจุดเด่นของชุดนี้ (เช่น ความสามารถในการอัปเกรด, การระบายความร้อน, ความเสถียร)",
        "กรุณาให้คำอธิบายที่กระชับ ชัดเจน และเข้าใจง่าย",
        "ส่งผลลัพธ์เป็น JSON object ที่มี key เดียวคือ \"explanation\" และมี value เป็น string คำอธิบายของคุณ (ควรมีความยาวพอสมควร ให้ข้อมูลที่เป็นประโยชน์)"
    ])
    return "\n".join(prompt_lines)

def get_build_explanation_from_gemini(selected_build: dict, original_query: dict):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not configured."}

    if "calculated_total_price_thb" not in selected_build:
        calculated_sum_for_selected_build = decimal.Decimal(0)
        component_keys_for_sum = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooler']
        for key in component_keys_for_sum:
            component_details = selected_build.get(key)
            if isinstance(component_details, dict) and "price_thb" in component_details:
                try:
                    price = component_details.get("price_thb", 0)
                    if price is None: price = 0
                    calculated_sum_for_selected_build += decimal.Decimal(str(price))
                except (ValueError, TypeError, decimal.InvalidOperation): pass
        selected_build["calculated_total_price_thb"] = float(calculated_sum_for_selected_build)

    prompt = generate_build_explanation_prompt(selected_build, original_query)
    model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest")

    raw_explanation_text = ""
    try:
        from google.generativeai.types import GenerationConfig
        generation_config = GenerationConfig( response_mime_type="application/json" )
        response = model.generate_content(prompt, generation_config=generation_config)
        raw_explanation_text = response.text
        parsed_json = json.loads(raw_explanation_text)
        if "explanation" not in parsed_json or not isinstance(parsed_json["explanation"], str):
            print(f"Warning: Gemini explanation response missing 'explanation' string: {parsed_json}")
            return {"error": "AI did not provide an explanation in the expected format.", "raw_ai_output": parsed_json}
        return parsed_json
    except json.JSONDecodeError as e:
        error_message = f"Error decoding explanation JSON from Gemini: {e}. Raw: {raw_explanation_text}"
        print(error_message)
        return {"error": error_message, "raw_ai_output": raw_explanation_text}
    except Exception as e:
        error_detail = str(e)
        prompt_feedback_text = None
        if 'response' in locals() and hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            prompt_feedback_text = str(response.prompt_feedback)
            print(f"Prompt Feedback for Explanation: {prompt_feedback_text}")
            error_detail = f"AI explanation request blocked/failed. Feedback: {prompt_feedback_text}"
        else:
            print(f"Error getting explanation from Gemini: {e}")
        return {"error": error_detail, "raw_ai_output_on_error": raw_explanation_text, "prompt_feedback_on_error": prompt_feedback_text}