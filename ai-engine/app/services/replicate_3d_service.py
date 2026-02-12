"""
Replicate 3D Reconstruction Service - Cloud-based TripoSR API wrapper
Handles 3D model generation via Replicate API with cost tracking and retry logic.
"""
import os
import asyncio
import aiohttp
import uuid
from typing import Optional
from PIL import Image
from io import BytesIO
import time


class Replicate3DService:
    """
    Cloud 3D reconstruction via Replicate API (TripoSR model).

    Features:
    - Async API calls with retry logic
    - Cost tracking and logging
    - Timeout handling
    - GLB file downloading and caching
    """

    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        self.cost_per_call = float(os.getenv("REPLICATE_COST_PER_CALL", "0.05"))
        self.timeout = 60  # Max 60 seconds per call
        self.max_retries = 3
        self.retry_delay = 2  # Start with 2 seconds

        if not self.api_token:
            print("⚠️  REPLICATE_API_TOKEN not set. 3D reconstruction will be skipped.")

    async def reconstruct_3d(
        self,
        image: Image.Image,
        foreground_ratio: float = 0.85
    ) -> Optional[str]:
        """
        Generate 3D mesh from single product image via Replicate API.

        Args:
            image: PIL Image (RGBA with transparent background preferred)
            foreground_ratio: How much of frame is product (0.5-1.0)

        Returns:
            Path to downloaded GLB file, or None if failed

        Raises:
            RuntimeError if API token not set or all retries exhausted
        """
        if not self.api_token:
            print("❌ Replicate API token not configured. Skipping 3D reconstruction.")
            return None

        # Convert PIL image to PNG bytes
        buffer = BytesIO()
        # Convert RGBA to RGB if needed
        if image.mode == "RGBA":
            rgb_image = Image.new("RGB", image.size, (255, 255, 255))
            rgb_image.paste(image, mask=image.split()[3])
            rgb_image.save(buffer, format="PNG")
        else:
            image.save(buffer, format="PNG")

        buffer.seek(0)
        image_bytes = buffer.getvalue()

        print(f"🚀 Calling Replicate TripoSR (foreground_ratio={foreground_ratio})")

        # Retry loop
        for attempt in range(self.max_retries):
            try:
                return await self._call_replicate_api(image_bytes, foreground_ratio)
            except asyncio.TimeoutError:
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    print(
                        f"   ⏱️  Timeout (attempt {attempt + 1}/{self.max_retries}). "
                        f"Retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                else:
                    print(f"   ❌ Max retries exhausted. Giving up on 3D reconstruction.")
                    return None
            except Exception as e:
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    print(
                        f"   ⚠️  Error: {e} (attempt {attempt + 1}/{self.max_retries}). "
                        f"Retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                else:
                    print(f"   ❌ Error after {self.max_retries} attempts: {e}")
                    return None

        return None

    async def _call_replicate_api(
        self,
        image_bytes: bytes,
        foreground_ratio: float
    ) -> str:
        """
        Call Replicate TripoSR API and download GLB result.

        Returns:
            Path to downloaded GLB file

        Raises:
            TimeoutError if API call exceeds timeout
            RuntimeError if API call fails
        """
        import aiofiles

        try:
            # Replicate API endpoint for TripoSR
            url = "https://api.replicate.com/v1/predictions"

            # Convert image bytes to base64 data URI
            import base64

            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            image_data_uri = f"data:image/png;base64,{b64_image}"

            # Request payload
            payload = {
                "version": "09a19d70d8c43c5ff246bc65e3df8b42e4e0cbd77bd653c54bdd892f26857db3",
                "input": {
                    "image": image_data_uri,
                    "foreground_ratio": foreground_ratio,
                    "mc_resolution": 256,
                    "formats": "glb"
                }
            }

            headers = {
                "Authorization": f"Token {self.api_token}",
                "Content-Type": "application/json"
            }

            # Create async HTTP client with timeout
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                # Step 1: Create prediction
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status not in (200, 201):
                        error_text = await resp.text()
                        raise RuntimeError(
                            f"Replicate API error {resp.status}: {error_text}"
                        )

                    result = await resp.json()
                    prediction_id = result["id"]
                    print(f"   📨 Prediction created: {prediction_id}")

                # Step 2: Poll for completion
                prediction_url = f"https://api.replicate.com/v1/predictions/{prediction_id}"
                start_time = time.time()
                poll_count = 0

                while True:
                    poll_count += 1
                    elapsed = time.time() - start_time

                    async with session.get(prediction_url, headers=headers) as resp:
                        if resp.status != 200:
                            error_text = await resp.text()
                            raise RuntimeError(
                                f"Failed to poll prediction: {resp.status} {error_text}"
                            )

                        result = await resp.json()
                        status = result.get("status")

                        if status == "succeeded":
                            print(f"   ✅ 3D reconstruction complete ({elapsed:.1f}s, {poll_count} polls)")
                            output = result.get("output")

                            if not output:
                                raise RuntimeError("No output from Replicate API")

                            # Output is the GLB download URL
                            glb_url = output if isinstance(output, str) else output[0]
                            print(f"   📥 Downloading GLB from {glb_url[:50]}...")

                            # Step 3: Download GLB file
                            glb_path = f"/tmp/product_mesh_{uuid.uuid4().hex[:8]}.glb"

                            async with session.get(glb_url) as resp:
                                if resp.status != 200:
                                    raise RuntimeError(
                                        f"Failed to download GLB: {resp.status}"
                                    )

                                async with aiofiles.open(glb_path, "wb") as f:
                                    await f.write(await resp.read())

                            print(f"   💾 GLB saved to {glb_path}")
                            return glb_path

                        elif status == "failed":
                            error = result.get("error")
                            raise RuntimeError(f"Prediction failed: {error}")

                        elif status == "processing":
                            # Still processing, wait and retry
                            wait_time = min(2 + poll_count * 0.5, 10)  # Exponential backoff, max 10s
                            print(f"   ⏳ Processing... ({elapsed:.1f}s, waiting {wait_time:.1f}s)")
                            await asyncio.sleep(wait_time)

                            # Safety timeout after 5 minutes
                            if elapsed > 300:
                                raise RuntimeError("3D reconstruction timeout (>5 min)")

        except asyncio.TimeoutError:
            print("   ⏱️  Replicate API call timed out")
            raise
        except Exception as e:
            print(f"   ❌ Replicate API error: {e}")
            raise

    def log_cost(self, success: bool):
        """Log API call cost for tracking and analytics."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        status = "✅ success" if success else "❌ failed"
        cost_str = f"${self.cost_per_call:.2f}"
        print(f"   💰 [{timestamp}] {status} | Cost: {cost_str}")


# Singleton instance
replicate_3d_service = Replicate3DService()
