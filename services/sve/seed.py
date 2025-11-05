"""
Database seeding script for Synthra Vector Engine
Generates initial 100+ component library using AI
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.sve.generator import SVECore
from services.sve.component_library import COMPONENT_LIBRARY


async def seed_database():
    """Seed the database with initial component library"""
    
    print("🌱 Initializing Synthra Vector Engine for seeding...")
    
    # Initialize SVE Core
    sve = SVECore()
    await sve.initialize()
    
    print(f"📦 Preparing to generate {len(COMPONENT_LIBRARY)} components\n")
    
    # Statistics
    total = len(COMPONENT_LIBRARY)
    successful = 0
    failed = 0
    skipped = 0
    
    # Process each component
    for idx, component in enumerate(COMPONENT_LIBRARY, 1):
        comp_type = component['type']
        category = component['category']
        
        print(f"[{idx}/{total}] Processing: {comp_type} ({category})")
        
        try:
            # Check if already exists
            existing = await sve.db.get_component(comp_type)
            if existing:
                print(f"  ⏭️  Already exists, skipping...")
                skipped += 1
                continue
            
            # Build generation kwargs
            kwargs = {
                'category': category,
                'pins': component.get('pins'),
                'style': component.get('style', 'IEEE'),
            }
            
            # Add additional details to prompt
            if 'details' in component:
                kwargs['additional_prompt'] = component['details']
            
            # Generate the component
            result = await sve.get_or_generate_component(
                comp_type,
                force_regenerate=False,
                **kwargs
            )
            
            if result and result.get('status') == 'success':
                print(f"  ✅ Generated successfully")
                successful += 1
            else:
                print(f"  ❌ Generation failed: {result.get('error', 'Unknown error')}")
                failed += 1
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            failed += 1
        
        print()  # Blank line between components
    
    # Print summary
    print("\n" + "="*60)
    print("📊 Seeding Summary")
    print("="*60)
    print(f"Total components:  {total}")
    print(f"✅ Successfully generated: {successful}")
    print(f"⏭️  Skipped (already exist): {skipped}")
    print(f"❌ Failed:                  {failed}")
    print(f"Success rate: {successful / (total - skipped) * 100 if (total - skipped) > 0 else 0:.1f}%")
    print("="*60)
    
    # Get final stats
    stats = await sve.db.get_stats()
    print(f"\n📈 Database Statistics:")
    print(f"Total components: {stats['total_components']}")
    print(f"Categories: {stats['categories']}")
    print(f"Most popular: {stats['most_popular']}")
    
    # Cleanup
    await sve.cleanup()
    print("\n✨ Seeding complete!")


async def reseed_component(component_type: str):
    """Regenerate a specific component"""
    
    print(f"🔄 Regenerating component: {component_type}")
    
    sve = SVECore()
    await sve.initialize()
    
    # Find component in library
    component = next((c for c in COMPONENT_LIBRARY if c['type'] == component_type), None)
    
    if not component:
        print(f"❌ Component '{component_type}' not found in library")
        await sve.cleanup()
        return
    
    # Delete existing if present
    await sve.db.delete_component(component_type)
    
    # Generate fresh
    kwargs = {
        'category': component['category'],
        'pins': component.get('pins'),
        'style': component.get('style', 'IEEE'),
    }
    
    if 'details' in component:
        kwargs['additional_prompt'] = component['details']
    
    result = await sve.get_or_generate_component(
        component_type,
        force_regenerate=True,
        **kwargs
    )
    
    if result and result.get('status') == 'success':
        print(f"✅ Successfully regenerated {component_type}")
    else:
        print(f"❌ Failed to regenerate: {result.get('error', 'Unknown error')}")
    
    await sve.cleanup()


async def list_components():
    """List all components in database"""
    
    sve = SVECore()
    await sve.initialize()
    
    stats = await sve.db.get_stats()
    
    print("\n📊 Component Database")
    print("="*60)
    print(f"Total: {stats['total_components']} components")
    print(f"Categories: {len(stats['categories'])}")
    print("\nBreakdown by category:")
    
    for category, count in stats['categories'].items():
        print(f"  {category:20s}: {count:3d} components")
    
    print("\n🔥 Most Popular Components:")
    for comp in stats['most_popular'][:10]:
        print(f"  {comp['component_type']:30s} (used {comp['usage_count']} times)")
    
    await sve.cleanup()


async def clear_database():
    """Clear all components (use with caution!)"""
    
    response = input("⚠️  Are you sure you want to delete ALL components? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled.")
        return
    
    sve = SVECore()
    await sve.initialize()
    
    # Get all components
    async with sve.db.pool.acquire() as conn:
        components = await conn.fetch("SELECT component_type FROM components")
        
        print(f"Deleting {len(components)} components...")
        
        for comp in components:
            await sve.db.delete_component(comp['component_type'])
        
        print(f"✅ Deleted {len(components)} components")
    
    await sve.cleanup()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        # Default: full seed
        asyncio.run(seed_database())
    else:
        command = sys.argv[1]
        
        if command == "reseed" and len(sys.argv) == 3:
            # Reseed specific component
            component_type = sys.argv[2]
            asyncio.run(reseed_component(component_type))
        
        elif command == "list":
            # List all components
            asyncio.run(list_components())
        
        elif command == "clear":
            # Clear database
            asyncio.run(clear_database())
        
        else:
            print("Usage:")
            print("  python seed.py              - Seed database with all components")
            print("  python seed.py reseed <type> - Regenerate specific component")
            print("  python seed.py list          - List all components")
            print("  python seed.py clear         - Clear all components (careful!)")
