import React from 'react';
import { ScrollableLayout, Card, CardHeader, CardContent, Button, Flex, Stack } from './ui';

const DesignSystemDemo: React.FC = () => {
  return (
    <ScrollableLayout padding="lg" maxWidth="xl">
      <Stack spacing="xl">
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
              🎨 Design System Transformation
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '1.125rem' }}>
              From scattered components to cohesive design language
            </p>
          </CardHeader>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              ✅ What We've Accomplished
            </h2>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#059669' }}>
                  🏗️ Foundation Components
                </h3>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#374151' }}>
                  <li><strong>Button:</strong> 5 variants (primary, secondary, accent, ghost, danger) × 5 sizes</li>
                  <li><strong>Card:</strong> Flexible containers with header/content/footer patterns</li>
                  <li><strong>Input/Select:</strong> Form components with validation states</li>
                  <li><strong>TabBar:</strong> Navigation with badge support and accessibility</li>
                  <li><strong>Layout:</strong> Container, Flex, Grid, Stack primitives</li>
                </ul>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0891b2' }}>
                  🎯 Design Token Integration
                </h3>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#374151' }}>
                  <li>Consistent color palette from existing design-system.css</li>
                  <li>Typography scale with proper font weights and sizing</li>
                  <li>Spacing system for consistent layout patterns</li>
                  <li>Component-specific tokens for specialized use cases</li>
                </ul>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#7c3aed' }}>
                  🚀 Implementation Example
                </h3>
                <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                  Created <code>ItchGamesRedesigned.tsx</code> showing the transformation from scattered styling to cohesive component usage.
                </p>
              </div>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="lg">
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              🎮 Interactive Demo
            </h2>
            <p style={{ margin: 0, color: '#6b7280' }}>
              See the design system components in action
            </p>
          </CardHeader>
          <CardContent>
            <Stack spacing="lg">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Button Variants
                </h3>
                <Flex gap="md" wrap="wrap">
                  <Button variant="primary" size="md">Primary</Button>
                  <Button variant="secondary" size="md">Secondary</Button>
                  <Button variant="accent" size="md">Accent</Button>
                  <Button variant="ghost" size="md">Ghost</Button>
                  <Button variant="danger" size="md">Danger</Button>
                </Flex>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Button Sizes
                </h3>
                <Flex gap="md" align="center" wrap="wrap">
                  <Button variant="primary" size="xs">Extra Small</Button>
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="xl">Extra Large</Button>
                </Flex>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Card Variations
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Card variant="default" padding="md">
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Default Card</h4>
                    <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Standard card styling</p>
                  </Card>
                  <Card variant="outlined" padding="md">
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Outlined Card</h4>
                    <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Border emphasis</p>
                  </Card>
                  <Card variant="elevated" padding="md">
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Elevated Card</h4>
                    <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Shadow depth</p>
                  </Card>
                </div>
              </div>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="flat" padding="lg" style={{ backgroundColor: '#f9fafb', border: '2px dashed #d1d5db' }}>
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              🔄 Next Steps: Migration Strategy
            </h2>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#7c2d12' }}>
                  1. Page-by-Page Migration
                </h3>
                <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                  Replace existing components in each page with design system equivalents:
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                  <li>GameLibrary.tsx → Use Card, Button, Input components</li>
                  <li>InstallationWizard.tsx → Use Container, Stack, Button patterns</li>
                  <li>GameDetails.tsx → Use Card layouts and Typography</li>
                  <li>GameUpload.tsx → Use Input variants and form patterns</li>
                </ul>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#7c2d12' }}>
                  2. Remove Legacy CSS
                </h3>
                <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                  Clean up redundant styles after migration is complete.
                </p>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#7c2d12' }}>
                  3. Documentation & Guidelines
                </h3>
                <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                  Create component usage docs and design guidelines for team consistency.
                </p>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </ScrollableLayout>
  );
};

export default DesignSystemDemo;
