"""
SVE Symbol Generation Integration
Simplified implementation without heavy ML dependencies
"""

from typing import Dict, Any, Tuple, Optional
from symbol_generator import SymbolGenerator
import json
import logging

logger = logging.getLogger(__name__)

class SVECore:
    """
    SVE (Synthra Vector Engine) Core
    Handles symbol generation and caching
    """

    def __init__(self, db_url: str = None):
        """Initialize SVE Core"""
        self.generator = SymbolGenerator()
        self.db_url = db_url
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.db = None

    async def initialize(self):
        """Initialize SVE (placeholder for async init)"""
        logger.info("SVE Core initialized with SymbolGenerator")

    async def get_or_generate_component(
        self,
        component_type: str,
        category: str = "passive",
        force_regenerate: bool = False,
        style: str = "IEEE",
        num_pins: Optional[int] = None,
        additional_details: str = ""
    ) -> Dict[str, Any]:
        """
        Get component from cache/DB or generate new one

        Args:
            component_type: Type name (e.g., 'AND2', 'R', 'Q')
            category: Component category
            force_regenerate: Force regeneration even if cached
            style: Symbol style (IEEE, IEC, etc)
            num_pins: Number of pins (optional)
            additional_details: Additional specification info

        Returns:
            {
                'component_type': str,
                'svg_content': str,
                'pins': List[Dict],
                'category': str,
                'quality_score': float,
                'cached': bool
            }
        """

        # Check cache first
        cache_key = f"{component_type}_{category}"
        if cache_key in self.cache and not force_regenerate:
            logger.info(f"Using cached symbol for {component_type}")
            result = self.cache[cache_key].copy()
            result['cached'] = True
            return result

        # Generate new symbol
        logger.info(f"Generating symbol for {component_type} (category: {category})")

        spec = {
            'symbol_name': component_type.upper(),
            'category': category.lower(),
            'description': additional_details,
            'pins': self._get_default_pins(component_type, category, num_pins)
        }

        try:
            svg, normalized_pins = self.generator.generate_symbol(spec)

            result = {
                'component_type': component_type,
                'svg_content': svg,
                'pins': normalized_pins,
                'category': category,
                'quality_score': 0.95,  # Hardcoded since we're not using ML
                'cached': False
            }

            # Cache the result
            self.cache[cache_key] = result.copy()

            return result

        except Exception as e:
            logger.error(f"Failed to generate symbol for {component_type}: {str(e)}")
            raise

    def _get_default_pins(
        self,
        component_type: str,
        category: str,
        num_pins: Optional[int]
    ) -> list:
        """Get default pin configuration based on component type"""

        type_upper = component_type.upper()

        # Logic gates
        if type_upper in ['AND2', 'OR2', 'NAND2', 'NOR2']:
            return [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ]
        elif type_upper == 'NOT':
            return [
                {'name': 'A', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ]
        elif type_upper == 'XOR2':
            return [
                {'name': 'A', 'direction': 'input'},
                {'name': 'B', 'direction': 'input'},
                {'name': 'Y', 'direction': 'output'},
            ]

        # Passive components
        elif type_upper == 'R':
            return [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ]
        elif type_upper == 'C':
            return [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ]
        elif type_upper == 'L':
            return [
                {'name': 'p', 'direction': 'inout'},
                {'name': 'n', 'direction': 'inout'},
            ]

        # Active components
        elif type_upper == 'D':
            return [
                {'name': 'anode', 'direction': 'inout'},
                {'name': 'cathode', 'direction': 'inout'},
            ]
        elif type_upper == 'Q':
            return [
                {'name': 'collector', 'direction': 'inout'},
                {'name': 'base', 'direction': 'inout'},
                {'name': 'emitter', 'direction': 'inout'},
            ]
        elif type_upper == 'U':
            return [
                {'name': 'in_pos', 'direction': 'input'},
                {'name': 'in_neg', 'direction': 'input'},
                {'name': 'vcc', 'direction': 'input'},
                {'name': 'vee', 'direction': 'input'},
                {'name': 'out', 'direction': 'output'},
            ]

        # Power
        elif type_upper == 'V':
            return [
                {'name': 'pos', 'direction': 'output'},
                {'name': 'neg', 'direction': 'output'},
            ]
        elif type_upper == 'I':
            return [
                {'name': 'pos', 'direction': 'output'},
                {'name': 'neg', 'direction': 'output'},
            ]
        elif type_upper == 'GND':
            return [
                {'name': 'gnd', 'direction': 'inout'},
            ]

        # Generic fallback
        else:
            if num_pins:
                return [{'name': f'P{i+1}', 'direction': 'inout'} for i in range(num_pins)]
            else:
                return [
                    {'name': 'p', 'direction': 'inout'},
                    {'name': 'n', 'direction': 'inout'},
                ]
            ", professional schematic symbol, IEEE standard, "
            "black lines on white background, simple line art, "
            "technical drawing, vector style, clean minimal design, "
            "no shading, no gradients, circuit diagram style"
        )

        self.negative_prompt = (
            "photo, realistic, 3D, shading, shadows, gradients, colors, "
            "complex, detailed background, text, labels, watermark"
        )

    def _load_model(self):
        """Load SDXL Turbo model"""
        print(f"🔥 Loading {self.model_id} on {self.device}...")

        try:
            self.pipeline = AutoPipelineForText2Image.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                variant="fp16" if self.device == "cuda" else None
            )
            self.pipeline.to(self.device)

            # Enable optimizations
            if self.device == "cuda":
                self.pipeline.enable_attention_slicing()
                self.pipeline.enable_vae_tiling()

            print("✅ Model loaded successfully")
        except Exception as e:
            print(f"⚠️  Failed to load SDXL: {e}")
            print("💡 Falling back to lightweight model")
            # Fallback to smaller model
            self.pipeline = None

    def generate_symbol(
        self,
        component_type: str,
        component_category: str = "passive",
        style: str = "IEEE",
        num_pins: Optional[int] = None,
        additional_details: str = ""
    ) -> Image.Image:
        """
        Generate a schematic symbol image

        Args:
            component_type: e.g., "resistor", "AND gate", "op-amp"
            component_category: passive, active, digital, analog
            style: IEEE, IEC, ANSI
            num_pins: Number of pins if applicable
            additional_details: Extra prompt details

        Returns:
            PIL Image of generated symbol
        """
        # Build comprehensive prompt
        prompt = self._build_prompt(
            component_type,
            component_category,
            style,
            num_pins,
            additional_details
        )

        print(f"🎨 Generating: {component_type}")
        print(f"📝 Prompt: {prompt[:100]}...")

        try:
            # Generate with SDXL Turbo (1 step, very fast)
            image = self.pipeline(
                prompt=prompt,
                negative_prompt=self.negative_prompt,
                num_inference_steps=1,  # Turbo uses 1 step
                guidance_scale=0.0,  # Turbo doesn't need guidance
                height=512,
                width=512
            ).images[0]

            return image

        except Exception as e:
            print(f"❌ Generation failed: {e}")
            # Return placeholder
            return Image.new('RGB', (512, 512), color='white')

    def _build_prompt(
        self,
        component_type: str,
        category: str,
        style: str,
        num_pins: Optional[int],
        details: str
    ) -> str:
        """Build optimized prompt for schematic generation"""

        prompt_parts = [
            f"{style} standard {component_type} schematic symbol"
        ]

        # Add category-specific details
        if category == "passive":
            prompt_parts.append("passive component")
        elif category == "active":
            prompt_parts.append("active semiconductor device")
        elif category == "digital":
            prompt_parts.append("digital logic gate")
        elif category == "analog":
            prompt_parts.append("analog circuit element")

        # Add pin count if specified
        if num_pins:
            prompt_parts.append(f"with {num_pins} pins")

        # Add custom details
        if details:
            prompt_parts.append(details)

        # Combine and add suffix
        prompt = ", ".join(prompt_parts) + self.base_prompt_suffix

        return prompt

    def batch_generate(
        self,
        components: List[Dict[str, Any]],
        batch_size: int = 4
    ) -> List[Tuple[str, Image.Image]]:
        """
        Generate multiple symbols in batch

        Args:
            components: List of component specs
            batch_size: Number to generate at once

        Returns:
            List of (component_type, image) tuples
        """
        results = []

        for i in range(0, len(components), batch_size):
            batch = components[i:i+batch_size]

            for comp in batch:
                image = self.generate_symbol(
                    component_type=comp['type'],
                    component_category=comp.get('category', 'passive'),
                    style=comp.get('style', 'IEEE'),
                    num_pins=comp.get('pins'),
                    additional_details=comp.get('details', '')
                )

                results.append((comp['type'], image))

        return results


class SVGVectorizer:
    """
    Converts raster images to clean SVG vectors
    Uses potrace or autotrace under the hood
    """

    def __init__(self, tool: str = "potrace"):
        self.tool = tool
        self._check_tool()

    def _check_tool(self):
        """Check if vectorization tool is installed"""
        try:
            subprocess.run(
                [self.tool, "--version"],
                capture_output=True,
                check=True
            )
            print(f"✅ {self.tool} is available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"⚠️  {self.tool} not found. Install: apt install {self.tool}")

    def vectorize(
        self,
        image: Image.Image,
        threshold: int = 128,
        optimize: bool = True
    ) -> str:
        """
        Convert raster image to SVG

        Args:
            image: PIL Image
            threshold: Binarization threshold
            optimize: Apply SVG optimization

        Returns:
            SVG string
        """
        import tempfile

        # Convert to grayscale and binarize
        gray = image.convert('L')
        binary = gray.point(lambda x: 0 if x < threshold else 255, '1')

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.bmp', delete=False) as tmp:
            binary.save(tmp.name, 'BMP')
            tmp_path = tmp.name

        try:
            # Run potrace
            svg_path = tmp_path.replace('.bmp', '.svg')

            subprocess.run(
                [
                    self.tool,
                    tmp_path,
                    '-s',  # SVG output
                    '-o', svg_path,
                    '--tight'  # Tight bounding box
                ],
                check=True,
                capture_output=True
            )

            # Read SVG
            with open(svg_path, 'r') as f:
                svg_content = f.read()

            # Cleanup
            Path(tmp_path).unlink()
            Path(svg_path).unlink()

            # Optimize if requested
            if optimize:
                svg_content = self._optimize_svg(svg_content)

            return svg_content

        except Exception as e:
            print(f"❌ Vectorization failed: {e}")
            # Return minimal SVG
            return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>'

    def _optimize_svg(self, svg_content: str) -> str:
        """Optimize SVG (remove redundant data, simplify paths)"""
        try:
            # Use svgo if available
            result = subprocess.run(
                ['svgo', '--input', '-', '--output', '-'],
                input=svg_content.encode(),
                capture_output=True
            )

            if result.returncode == 0:
                return result.stdout.decode()
        except:
            pass

        # Return original if optimization fails
        return svg_content


class StyleNormalizer:
    """
    Ensures all generated symbols maintain consistent style
    Uses CLIP embeddings to measure and enforce visual consistency
    """

    def __init__(self):
        self.reference_embeddings = {}
        self._load_clip()

    def _load_clip(self):
        """Load CLIP model for style checking"""
        try:
            from transformers import CLIPProcessor, CLIPModel

            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

            print("✅ CLIP loaded for style normalization")
        except Exception as e:
            print(f"⚠️  CLIP not available: {e}")
            self.clip_model = None

    def check_consistency(
        self,
        image: Image.Image,
        reference_images: List[Image.Image]
    ) -> float:
        """
        Check style consistency against reference images

        Returns:
            Similarity score (0-1)
        """
        if not self.clip_model:
            return 0.8  # Default pass

        try:
            # Get embeddings
            inputs = self.clip_processor(
                images=[image] + reference_images,
                return_tensors="pt"
            )

            with torch.no_grad():
                embeddings = self.clip_model.get_image_features(**inputs)

            # Compute similarity
            target_emb = embeddings[0:1]
            ref_embs = embeddings[1:]

            similarities = torch.cosine_similarity(
                target_emb.unsqueeze(1),
                ref_embs.unsqueeze(0),
                dim=2
            )

            avg_similarity = similarities.mean().item()
            return avg_similarity

        except Exception as e:
            print(f"❌ Style check failed: {e}")
            return 0.5

    def normalize_style(
        self,
        svg_content: str,
        target_line_width: float = 2.0,
        target_viewbox: Tuple[int, int] = (100, 100)
    ) -> str:
        """
        Normalize SVG style attributes

        Args:
            svg_content: Raw SVG string
            target_line_width: Standard line width
            target_viewbox: Standard viewbox size

        Returns:
            Normalized SVG string
        """
        import xml.etree.ElementTree as ET

        try:
            # Parse SVG
            root = ET.fromstring(svg_content)

            # Set viewBox
            root.set('viewBox', f'0 0 {target_viewbox[0]} {target_viewbox[1]}')
            root.set('width', str(target_viewbox[0]))
            root.set('height', str(target_viewbox[1]))

            # Normalize stroke width
            for elem in root.iter():
                if 'stroke-width' in elem.attrib:
                    elem.set('stroke-width', str(target_line_width))
                if 'stroke' not in elem.attrib:
                    elem.set('stroke', 'black')
                if 'fill' not in elem.attrib:
                    elem.set('fill', 'none')

            # Convert back to string
            return ET.tostring(root, encoding='unicode')

        except Exception as e:
            print(f"⚠️  Style normalization failed: {e}")
            return svg_content


class ComponentDatabase:
    """
    PostgreSQL database interface for component symbols
    """

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None

    async def connect(self):
        """Initialize database connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()

    async def _create_tables(self):
        """Create component tables if they don't exist"""
        async with self.pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS components (
                    id SERIAL PRIMARY KEY,
                    component_type VARCHAR(255) UNIQUE NOT NULL,
                    category VARCHAR(100),
                    svg_content TEXT NOT NULL,
                    svg_hash VARCHAR(64),
                    pins INTEGER,
                    metadata JSONB,
                    style VARCHAR(50),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    usage_count INTEGER DEFAULT 0,
                    generation_prompt TEXT,
                    quality_score FLOAT
                )
            ''')

            await conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_component_type
                ON components(component_type)
            ''')

            await conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_category
                ON components(category)
            ''')

    async def component_exists(self, component_type: str) -> bool:
        """Check if component already exists in database"""
        async with self.pool.acquire() as conn:
            result = await conn.fetchval(
                'SELECT EXISTS(SELECT 1 FROM components WHERE component_type = $1)',
                component_type
            )
            return result

    async def get_component(self, component_type: str) -> Optional[Dict]:
        """Retrieve component from database"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM components WHERE component_type = $1',
                component_type
            )

            if row:
                # Increment usage counter
                await conn.execute(
                    'UPDATE components SET usage_count = usage_count + 1 WHERE component_type = $1',
                    component_type
                )
                return dict(row)

            return None

    async def store_component(
        self,
        component_type: str,
        svg_content: str,
        category: str,
        pins: Optional[int] = None,
        metadata: Optional[Dict] = None,
        style: str = "IEEE",
        generation_prompt: Optional[str] = None,
        quality_score: float = 0.0
    ):
        """Store generated component in database"""
        svg_hash = hashlib.sha256(svg_content.encode()).hexdigest()

        async with self.pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO components
                (component_type, category, svg_content, svg_hash, pins,
                 metadata, style, generation_prompt, quality_score)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (component_type) DO UPDATE
                SET svg_content = EXCLUDED.svg_content,
                    svg_hash = EXCLUDED.svg_hash,
                    updated_at = NOW()
            ''', component_type, category, svg_content, svg_hash, pins,
                json.dumps(metadata or {}), style, generation_prompt, quality_score)

    async def get_popular_components(self, limit: int = 50) -> List[Dict]:
        """Get most used components"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM components ORDER BY usage_count DESC LIMIT $1',
                limit
            )
            return [dict(row) for row in rows]

    async def search_components(
        self,
        query: str,
        category: Optional[str] = None
    ) -> List[Dict]:
        """Search components by type or category"""
        async with self.pool.acquire() as conn:
            if category:
                rows = await conn.fetch(
                    '''SELECT * FROM components
                       WHERE component_type ILIKE $1 AND category = $2
                       ORDER BY usage_count DESC''',
                    f'%{query}%', category
                )
            else:
                rows = await conn.fetch(
                    '''SELECT * FROM components
                       WHERE component_type ILIKE $1
                       ORDER BY usage_count DESC''',
                    f'%{query}%'
                )

            return [dict(row) for row in rows]


class SVECore:
    """
    Main SVE orchestrator that ties everything together
    """

    def __init__(self, db_connection_string: str):
        self.generator = ComponentSymbolGenerator()
        self.vectorizer = SVGVectorizer()
        self.normalizer = StyleNormalizer()
        self.db = ComponentDatabase(db_connection_string)

    async def initialize(self):
        """Initialize all systems"""
        await self.db.connect()
        print("✅ SVE Core initialized")

    async def get_or_generate_component(
        self,
        component_type: str,
        category: str = "passive",
        force_regenerate: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Main entry point: Check DB, generate if needed

        This is called automatically by the system when a component is needed
        """
        # Check database first
        if not force_regenerate:
            existing = await self.db.get_component(component_type)
            if existing:
                print(f"✅ Found {component_type} in database")
                return existing

        print(f"🔄 Generating {component_type}...")

        # Generate image
        image = self.generator.generate_symbol(
            component_type=component_type,
            component_category=category,
            **kwargs
        )

        # Vectorize to SVG
        svg_content = self.vectorizer.vectorize(image)

        # Normalize style
        svg_content = self.normalizer.normalize_style(svg_content)

        # TODO: Quality check with style normalizer
        quality_score = 0.85  # Placeholder

        # Store in database
        await self.db.store_component(
            component_type=component_type,
            svg_content=svg_content,
            category=category,
            pins=kwargs.get('num_pins'),
            metadata=kwargs.get('metadata'),
            style=kwargs.get('style', 'IEEE'),
            generation_prompt=None,
            quality_score=quality_score
        )

        print(f"✅ Generated and stored {component_type}")

        return {
            'component_type': component_type,
            'svg_content': svg_content,
            'category': category,
            'quality_score': quality_score
        }

    async def seed_database(self, components: List[Dict[str, Any]]):
        """
        Seed database with initial components
        Called during first-time setup
        """
        print(f"🌱 Seeding database with {len(components)} components...")

        for i, comp in enumerate(components, 1):
            print(f"[{i}/{len(components)}] Generating {comp['type']}...")

            await self.get_or_generate_component(
                component_type=comp['type'],
                category=comp.get('category', 'passive'),
                force_regenerate=True,
                style=comp.get('style', 'IEEE'),
                num_pins=comp.get('pins'),
                additional_details=comp.get('details', '')
            )

        print("✅ Database seeding complete")


# Export main class
__all__ = ['SVECore', 'ComponentSymbolGenerator', 'ComponentDatabase']
